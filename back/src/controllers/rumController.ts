import { Request, Response } from 'express';
import { OAuthClient } from '../models/OAuthClient';
import { RumLog, lcpRating, clsRating, inpRating, fcpRating, ttfbRating } from '../models/RumLog';
import { AppError } from '../middleware/errorHandler';
import { getRumHtmlSnippet } from '../utils/rumSnippet';

// ── POST /api/monitoring/rum ───────────────────────────────────────────────────
// Called directly from the browser — only clientId required, no secret
export const ingestRum = async (req: Request, res: Response): Promise<void> => {
  const { clientId: rawClientId, sessionId, url, deviceType, connectionType, vitals } = req.body as {
    clientId: string; sessionId: string; url: string;
    deviceType?: string; connectionType?: string;
    vitals: { lcp?: number; cls?: number; inp?: number; fcp?: number; ttfb?: number; };
  };

  if (!rawClientId) throw new AppError('clientId is required', 400);
  if (!sessionId)   throw new AppError('sessionId is required', 400);

  const client = await OAuthClient.findOne({ clientId: rawClientId, isActive: true }).select('_id');
  if (!client) throw new AppError('Unknown client', 401);

  let safePath = '/';
  try {
    const parsed = new URL(url || '/', 'http://x');
    safePath = parsed.pathname.slice(0, 500);
  } catch { safePath = '/'; }

  const v = vitals || {};

  await RumLog.create({
    clientId:       client._id,
    sessionId:      String(sessionId).slice(0, 64),
    url:            safePath,
    deviceType:     deviceType || 'unknown',
    connectionType: connectionType || 'unknown',
    lcp:  v.lcp  != null ? Number(v.lcp)  : undefined,
    lcpRating:  v.lcp  != null ? lcpRating(Number(v.lcp))   : undefined,
    cls:  v.cls  != null ? Number(v.cls)  : undefined,
    clsRating:  v.cls  != null ? clsRating(Number(v.cls))   : undefined,
    inp:  v.inp  != null ? Number(v.inp)  : undefined,
    inpRating:  v.inp  != null ? inpRating(Number(v.inp))   : undefined,
    fcp:  v.fcp  != null ? Number(v.fcp)  : undefined,
    fcpRating:  v.fcp  != null ? fcpRating(Number(v.fcp))   : undefined,
    ttfb: v.ttfb != null ? Number(v.ttfb) : undefined,
    ttfbRating: v.ttfb != null ? ttfbRating(Number(v.ttfb)) : undefined,
    timestamp: new Date(),
  });

  res.json({ success: true });
};

// ── GET /api/monitoring/:clientId/rum ─────────────────────────────────────────
export const getRumStats = async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const { range = '24h' } = req.query as { range?: string };

  const client = await OAuthClient.findOne({ clientId });
  if (!client) throw new AppError('Client not found', 404);

  const rangeMs: Record<string, number> = {
    '1h': 3_600_000, '24h': 86_400_000, '7d': 604_800_000, '30d': 2_592_000_000,
  };
  const since = new Date(Date.now() - (rangeMs[range] || 86_400_000));
  const logs = await RumLog.find({ clientId: client._id, timestamp: { $gte: since } }).lean();

  if (logs.length === 0) {
    res.json({ success: true, totalSessions: 0, summary: {}, ratingBreakdown: {}, topPages: [], timeSeries: [], deviceBreakdown: [] });
    return;
  }

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 100) / 100 : null;
  const pct = (arr: number[], p: number) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    return Math.round(s[Math.floor(s.length * p / 100)] * 100) / 100;
  };

  const lcps  = logs.filter(l => l.lcp  != null).map(l => l.lcp!);
  const clss  = logs.filter(l => l.cls  != null).map(l => l.cls!);
  const inps  = logs.filter(l => l.inp  != null).map(l => l.inp!);
  const fcps  = logs.filter(l => l.fcp  != null).map(l => l.fcp!);
  const ttfbs = logs.filter(l => l.ttfb != null).map(l => l.ttfb!);

  const summary = {
    lcp:  { avg: avg(lcps),  p75: pct(lcps, 75),  count: lcps.length  },
    cls:  { avg: avg(clss),  p75: pct(clss, 75),  count: clss.length  },
    inp:  { avg: avg(inps),  p75: pct(inps, 75),  count: inps.length  },
    fcp:  { avg: avg(fcps),  p75: pct(fcps, 75),  count: fcps.length  },
    ttfb: { avg: avg(ttfbs), p75: pct(ttfbs, 75), count: ttfbs.length },
  };

  const ratingCount = (field: 'lcpRating' | 'clsRating' | 'inpRating' | 'fcpRating' | 'ttfbRating') => {
    const r = { good: 0, 'needs-improvement': 0, poor: 0 };
    logs.forEach(l => { const v = l[field]; if (v) r[v as keyof typeof r]++; });
    return r;
  };

  const ratingBreakdown = {
    lcp: ratingCount('lcpRating'), cls: ratingCount('clsRating'),
    inp: ratingCount('inpRating'), fcp: ratingCount('fcpRating'), ttfb: ratingCount('ttfbRating'),
  };

  const pageMap: Record<string, { count: number; lcpSum: number; lcpN: number }> = {};
  logs.forEach(l => {
    if (!pageMap[l.url]) pageMap[l.url] = { count: 0, lcpSum: 0, lcpN: 0 };
    pageMap[l.url].count++;
    if (l.lcp != null) { pageMap[l.url].lcpSum += l.lcp; pageMap[l.url].lcpN++; }
  });
  const topPages = Object.entries(pageMap)
    .map(([url, d]) => ({ url, count: d.count, avgLcp: d.lcpN ? Math.round(d.lcpSum / d.lcpN) : null }))
    .sort((a, b) => b.count - a.count).slice(0, 10);

  const bucketMs = range === '7d' || range === '30d' ? 86_400_000 : 3_600_000;
  const bucketMap: Record<string, { lcps: number[]; clss: number[]; count: number }> = {};
  logs.forEach(l => {
    const bucket = new Date(Math.floor(l.timestamp.getTime() / bucketMs) * bucketMs).toISOString();
    if (!bucketMap[bucket]) bucketMap[bucket] = { lcps: [], clss: [], count: 0 };
    bucketMap[bucket].count++;
    if (l.lcp != null) bucketMap[bucket].lcps.push(l.lcp);
    if (l.cls != null) bucketMap[bucket].clss.push(l.cls);
  });
  const timeSeries = Object.entries(bucketMap)
    .map(([ts, d]) => ({ timestamp: ts, count: d.count, avgLcp: avg(d.lcps), avgCls: avg(d.clss) }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const devMap: Record<string, number> = {};
  logs.forEach(l => { devMap[l.deviceType || 'unknown'] = (devMap[l.deviceType || 'unknown'] || 0) + 1; });
  const deviceBreakdown = Object.entries(devMap).map(([type, count]) => ({ type, count }));

  const totalSessions = new Set(logs.map(l => l.sessionId)).size;

  res.json({ success: true, totalSessions, summary, ratingBreakdown, topPages, timeSeries, deviceBreakdown });
};

// ── GET /api/monitoring/:clientId/rum-snippet ─────────────────────────────────
export const getRumSnippet = async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const client = await OAuthClient.findOne({ clientId });
  if (!client) throw new AppError('Client not found', 404);

  const baseUrl = process.env.FRONTEND_URL?.replace(':5173', ':5000') || 'http://localhost:5000';
  const snippet = getRumHtmlSnippet(clientId, baseUrl);
  res.json({ success: true, snippet });
};