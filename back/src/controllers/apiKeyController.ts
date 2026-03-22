import { Request, Response } from 'express';
import crypto from 'crypto';
import { ApiKey } from '../models/ApiKey';
import { AppError } from '../middleware/errorHandler';
import { logAudit } from '../services/auditService';

const PREFIX = 'ua_';

/** Generate a new personal access token */
export const createApiKey = async (req: Request, res: Response): Promise<void> => {
  const { name, scopes, expiresInDays } = req.body as {
    name: string;
    scopes?: string[];
    expiresInDays?: number;
  };

  if (!name?.trim()) throw new AppError('Key name is required', 400);

  // Limit per user
  const count = await ApiKey.countDocuments({ userId: req.user!.userId, isActive: true });
  if (count >= 20) throw new AppError('Maximum 20 active API keys allowed', 400);

  const rawKey = `${PREFIX}${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 12); // e.g. "ua_5f3a…"

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  const apiKey = await ApiKey.create({
    userId: req.user!.userId,
    name: name.trim(),
    keyHash,
    keyPrefix,
    scopes: scopes || [],
    expiresAt,
  });

  await logAudit({ userId: req.user!.userId, action: 'api_key.created', resourceId: apiKey._id.toString(), req });

  // Return the raw key ONCE — never stored in plaintext
  res.status(201).json({
    success: true,
    message: 'API key created. Copy it now — it will not be shown again.',
    apiKey: {
      _id: apiKey._id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    },
    rawKey, // shown once
  });
};

/** List all API keys for current user (without hashes) */
export const listApiKeys = async (req: Request, res: Response): Promise<void> => {
  const keys = await ApiKey.find({ userId: req.user!.userId, isActive: true })
    .select('-keyHash')
    .sort({ createdAt: -1 });
  res.json({ success: true, apiKeys: keys });
};

/** Revoke an API key */
export const revokeApiKey = async (req: Request, res: Response): Promise<void> => {
  const key = await ApiKey.findOne({ _id: req.params.id, userId: req.user!.userId });
  if (!key) throw new AppError('API key not found', 404);

  key.isActive = false;
  await key.save();

  await logAudit({ userId: req.user!.userId, action: 'api_key.revoked', resourceId: key._id.toString(), req });
  res.json({ success: true, message: 'API key revoked' });
};
