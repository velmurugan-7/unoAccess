import { Request, Response } from 'express';
import crypto from 'crypto';
import { CustomEvent } from '../models/SdkEvents';
import { CapturedError } from '../models/SdkEvents';
import { OAuthClient } from '../models/OAuthClient';
import { decrypt } from '../utils/encryption';
import { AppError } from '../middleware/errorHandler';

// ── Auth helper (reused from monitoringController pattern) ────────────────────
async function authenticateSDKClient(req: Request) {
  let clientId: string | undefined;
  let clientSecret: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
    const colon = decoded.indexOf(':');
    clientId = decoded.slice(0, colon);
    clientSecret = decoded.slice(colon + 1);
  } else {
    clientId = req.body.client_id;
    clientSecret = req.body.client_secret;
  }

  if (!clientId || !clientSecret) throw new AppError('Client credentials required', 401);
  const client = await OAuthClient.findOne({ clientId, isActive: true });
  if (!client) throw new AppError('Unknown client', 401);
  if (decrypt(client.clientSecret) !== clientSecret) throw new AppError('Invalid credentials', 401);
  return client;
}

// ── POST /api/monitoring/events  (monitor.trace) ──────────────────────────────
export const ingestCustomEvents = async (req: Request, res: Response): Promise<void> => {
  const client = await authenticateSDKClient(req);
  const { events } = req.body as { events?: unknown[] };
  if (!Array.isArray(events) || events.length === 0) throw new AppError('events array required', 400);
  if (events.length > 500) throw new AppError('Max 500 events per batch', 400);

  const docs = (events as Record<string, unknown>[]).map(e => ({
    clientId: client._id,
    userId: e.userId || undefined,
    name: String(e.name || 'unknown').slice(0, 200),
    properties: (typeof e.properties === 'object' && e.properties) ? e.properties as Record<string, unknown> : {},
    value: typeof e.value === 'number' ? e.value : undefined,
    service: e.service ? String(e.service).slice(0, 100) : undefined,
    timestamp: e.timestamp ? new Date(e.timestamp as string) : new Date(),
  }));

  await CustomEvent.insertMany(docs, { ordered: false });
  res.json({ success: true, ingested: docs.length });
};

// ── POST /api/monitoring/errors  (monitor.captureError) ───────────────────────
export const ingestErrors = async (req: Request, res: Response): Promise<void> => {
  const client = await authenticateSDKClient(req);
  const { errors } = req.body as { errors?: unknown[] };
  if (!Array.isArray(errors) || errors.length === 0) throw new AppError('errors array required', 400);

  for (const e of errors as Record<string, unknown>[]) {
    const message = String(e.message || 'Unknown error').slice(0, 1000);
    const fingerprint = crypto.createHash('sha256')
      .update(message.replace(/\d+/g, 'N').slice(0, 200))
      .digest('hex');

    const userId = e.userId ? String(e.userId) : null;
    await CapturedError.findOneAndUpdate(
      { clientId: client._id, fingerprint },
      {
        $inc: { count: 1 },
        $set: { message, stack: e.stack ? String(e.stack).slice(0, 10000) : undefined, lastSeenAt: new Date(), service: e.service ? String(e.service).slice(0, 100) : undefined },
        $setOnInsert: { firstSeenAt: new Date(), metadata: (e.metadata as Record<string, unknown>) || {} },
        ...(userId ? { $addToSet: { affectedUsers: userId } } : {}),
      },
      { upsert: true, new: true }
    );
  }

  res.json({ success: true });
};

// ── GET /api/monitoring/:clientId/custom-events ───────────────────────────────
export const getCustomEvents = async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const { range = '24h', name } = req.query as Record<string, string>;
  const client = await OAuthClient.findOne({ clientId });
  if (!client) throw new AppError('Client not found', 404);

  const rangeMs: Record<string, number> = { '1h': 3600_000, '24h': 86400_000, '7d': 604800_000 };
  const since = new Date(Date.now() - (rangeMs[range] || 86400_000));

  const query: Record<string, unknown> = { clientId: client._id, timestamp: { $gte: since } };
  if (name) query.name = name;

  const [names, events] = await Promise.all([
    CustomEvent.distinct('name', { clientId: client._id }),
    CustomEvent.find(query).sort({ timestamp: -1 }).limit(500),
  ]);

  res.json({ success: true, names, events });
};

// ── GET /api/monitoring/:clientId/errors ──────────────────────────────────────
export const getCapturedErrors = async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const { includeResolved = 'false' } = req.query as Record<string, string>;
  const client = await OAuthClient.findOne({ clientId });
  if (!client) throw new AppError('Client not found', 404);

  const query: Record<string, unknown> = { clientId: client._id };
  if (includeResolved !== 'true') query.isResolved = false;

  const errors = await CapturedError.find(query).sort({ lastSeenAt: -1 }).limit(200);
  res.json({ success: true, errors });
};

// ── PATCH /api/monitoring/:clientId/errors/:id/resolve ────────────────────────
export const resolveError = async (req: Request, res: Response): Promise<void> => {
  const { clientId, id } = req.params;
  const client = await OAuthClient.findOne({ clientId });
  if (!client) throw new AppError('Client not found', 404);

  await CapturedError.findOneAndUpdate({ _id: id, clientId: client._id }, { isResolved: true });
  res.json({ success: true });
};

// ── GET /api/monitoring/:clientId/service-map ─────────────────────────────────
export const getServiceMap = async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const client = await OAuthClient.findOne({ clientId });
  if (!client) throw new AppError('Client not found', 404);

  // Aggregate services from custom events and captured errors
  const [eventServices, errorServices] = await Promise.all([
    CustomEvent.aggregate([
      { $match: { clientId: client._id, service: { $exists: true, $ne: null } } },
      { $group: { _id: '$service', eventCount: { $sum: 1 }, names: { $addToSet: '$name' } } },
    ]),
    CapturedError.aggregate([
      { $match: { clientId: client._id, service: { $exists: true, $ne: null }, isResolved: false } },
      { $group: { _id: '$service', errorCount: { $sum: '$count' } } },
    ]),
  ]);

  const errorMap = Object.fromEntries(errorServices.map((e: { _id: string; errorCount: number }) => [e._id, e.errorCount]));

  const nodes = eventServices.map((s: { _id: string; eventCount: number; names: string[] }) => ({
    id: s._id,
    label: s._id,
    eventCount: s.eventCount,
    errorCount: errorMap[s._id] || 0,
    eventTypes: (s.names as string[]).slice(0, 5),
  }));

  // Simple edges: services that share event types are considered linked
  const edges: { source: string; target: string; weight: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const shared = nodes[i].eventTypes.filter((t: string) => nodes[j].eventTypes.includes(t)).length;
      if (shared > 0) edges.push({ source: nodes[i].id, target: nodes[j].id, weight: shared });
    }
  }

  res.json({ success: true, nodes, edges });
};
