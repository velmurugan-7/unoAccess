import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { OAuthClient } from '../models/OAuthClient';
import { User } from '../models/User';
import { AccessToken } from '../models/AccessToken';
import { AuditLog } from '../models/AuditLog';
import { Announcement } from '../models/Announcement';
import { Webhook } from '../models/Webhook';
import { RefreshToken } from '../models/RefreshToken';
import { encrypt, decrypt } from '../utils/encryption';
import { AppError } from '../middleware/errorHandler';
import { logAudit } from '../services/auditService';

// ── OAuth Clients ──────────────────────────────────────────────────────────
export const listClients = async (_req: Request, res: Response): Promise<void> => {
  const clients = await OAuthClient.find().populate('createdBy', 'name email');
  const safe = clients.map((c) => ({ ...c.toJSON(), clientSecret: undefined }));
  res.json({ success: true, clients: safe });
};

export const createClient = async (req: Request, res: Response): Promise<void> => {
  const { name, redirectUris, scopes, logoUrl, website } = req.body;
  const clientId = `ua_${uuidv4().replace(/-/g, '')}`;
  const rawSecret = crypto.randomBytes(32).toString('hex');
  const client = await OAuthClient.create({
    name, clientId, clientSecret: encrypt(rawSecret),
    redirectUris, scopes: scopes || ['openid', 'profile', 'email'], logoUrl, website,
    createdBy: req.user?.userId,
  });
  await logAudit({ actorId: req.user?.userId, action: 'admin.client_create', resourceId: clientId, req });
  res.status(201).json({ success: true, message: 'Client created. Save the secret — shown only once.', client: { ...client.toJSON(), clientSecret: rawSecret } });
};

export const updateClient = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, redirectUris, scopes, logoUrl, website, isActive } = req.body;
  const client = await OAuthClient.findByIdAndUpdate(id, { name, redirectUris, scopes, logoUrl, website, isActive }, { new: true, runValidators: true });
  if (!client) throw new AppError('Client not found', 404);
  await logAudit({ actorId: req.user?.userId, action: 'admin.client_update', resourceId: id, req });
  res.json({ success: true, message: 'Client updated', client: { ...client.toJSON(), clientSecret: undefined } });
};

export const deleteClient = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const client = await OAuthClient.findByIdAndDelete(id);
  if (!client) throw new AppError('Client not found', 404);
  await logAudit({ actorId: req.user?.userId, action: 'admin.client_delete', resourceId: id, req });
  res.json({ success: true, message: 'Client deleted' });
};

export const rotateClientSecret = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const rawSecret = crypto.randomBytes(32).toString('hex');
  const client = await OAuthClient.findByIdAndUpdate(id, { clientSecret: encrypt(rawSecret) }, { new: true });
  if (!client) throw new AppError('Client not found', 404);
  await logAudit({ actorId: req.user?.userId, action: 'admin.secret_rotate', resourceId: id, req });
  res.json({ success: true, message: 'Secret rotated.', clientSecret: rawSecret });
};

// ── User Management ────────────────────────────────────────────────────────
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const { search, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100);
  const query = search
    ? { $or: [{ email: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }] }
    : {};
  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    User.countDocuments(query),
  ]);
  res.json({ success: true, users, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  const connectedApps = await AccessToken.find({ userId: user._id, isRevoked: false, expiresAt: { $gt: new Date() } });
  const clientIds = [...new Set(connectedApps.map((t) => t.clientId))];
  const clients = await OAuthClient.find({ clientId: { $in: clientIds } }).select('name clientId logoUrl');
  const activeSessions = await RefreshToken.countDocuments({ userId: user._id, isRevoked: false, expiresAt: { $gt: new Date() } });
  res.json({ success: true, user, connectedApps: clients, activeSessions });
};

export const suspendUser = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Cannot suspend admin users', 400);
  user.isSuspended = true;
  await user.save();
  await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });
  await logAudit({ actorId: req.user?.userId, userId: user._id.toString(), action: 'admin.user_suspend', req });
  res.json({ success: true, message: 'User suspended and all sessions revoked.' });
};

export const unsuspendUser = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: false }, { new: true });
  if (!user) throw new AppError('User not found', 404);
  await logAudit({ actorId: req.user?.userId, userId: user._id.toString(), action: 'admin.user_unsuspend', req });
  res.json({ success: true, message: 'User unsuspended.' });
};

export const manualVerifyUser = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true, verificationToken: undefined, verificationTokenExpiry: undefined }, { new: true });
  if (!user) throw new AppError('User not found', 404);
  await logAudit({ actorId: req.user?.userId, userId: user._id.toString(), action: 'admin.user_verify', req });
  res.json({ success: true, message: 'User manually verified.' });
};

// ── Announcements ──────────────────────────────────────────────────────────
export const listAnnouncements = async (_req: Request, res: Response): Promise<void> => {
  const items = await Announcement.find().sort({ createdAt: -1 }).limit(20);
  res.json({ success: true, announcements: items });
};

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  const { title, message, type, expiresAt } = req.body;
  const ann = await Announcement.create({ title, message, type, expiresAt, createdBy: req.user?.userId });
  res.status(201).json({ success: true, announcement: ann });
};

export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
  const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!ann) throw new AppError('Not found', 404);
  res.json({ success: true, announcement: ann });
};

export const deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

// ── Admin Audit Log ────────────────────────────────────────────────────────
export const getAdminAuditLog = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
  const { action, userId } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (action) filter.action = action;
  if (userId) filter.$or = [{ userId }, { actorId: userId }];
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).populate('userId', 'name email').populate('actorId', 'name email'),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ success: true, logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// ── Dashboard Analytics ────────────────────────────────────────────────────
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  const now = new Date();
  const day = 24 * 3600 * 1000;

  const [totalUsers, verifiedUsers, suspendedUsers, totalClients, activeClients,
    newUsersToday, newUsersWeek, totalSessions, activeSessions,
    loginsTodayCount, totalTokens] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ isSuspended: true }),
    OAuthClient.countDocuments(),
    OAuthClient.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: new Date(now.getTime() - day) } }),
    User.countDocuments({ createdAt: { $gte: new Date(now.getTime() - 7 * day) } }),
    RefreshToken.countDocuments(),
    RefreshToken.countDocuments({ isRevoked: false, expiresAt: { $gt: now } }),
    AuditLog.countDocuments({ action: 'user.login', timestamp: { $gte: new Date(now.getTime() - day) } }),
    AccessToken.countDocuments({ isRevoked: false, expiresAt: { $gt: now } }),
  ]);

  // Signups over last 30 days
  const signupTrend = await User.aggregate([
    { $match: { createdAt: { $gte: new Date(now.getTime() - 30 * day) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Logins over last 7 days
  const loginTrend = await AuditLog.aggregate([
    { $match: { action: 'user.login', timestamp: { $gte: new Date(now.getTime() - 7 * day) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // OAuth usage by client
  const oauthByClient = await AccessToken.aggregate([
    { $match: { isRevoked: false, expiresAt: { $gt: now } } },
    { $group: { _id: '$clientId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.json({
    success: true,
    stats: {
      users: { total: totalUsers, verified: verifiedUsers, suspended: suspendedUsers, newToday: newUsersToday, newThisWeek: newUsersWeek },
      clients: { total: totalClients, active: activeClients },
      sessions: { total: totalSessions, active: activeSessions },
      tokens: { active: totalTokens },
      loginsToday: loginsTodayCount,
    },
    signupTrend, loginTrend, oauthByClient,
  });
};

// ── Webhooks (admin manages on behalf of clients) ──────────────────────────
export const listWebhooks = async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const client = await OAuthClient.findOne({ clientId });
  if (!client) throw new AppError('Client not found', 404);
  const hooks = await Webhook.find({ clientId: client._id }).select('-secret');
  res.json({ success: true, webhooks: hooks });
};

export const createWebhook = async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const client = await OAuthClient.findOne({ clientId });
  if (!client) throw new AppError('Client not found', 404);
  const { url, events } = req.body;
  const rawSecret = crypto.randomBytes(32).toString('hex');
  const hook = await Webhook.create({ clientId: client._id, url, events, secret: encrypt(rawSecret) });
  res.status(201).json({ success: true, webhook: { ...hook.toJSON(), secret: rawSecret } });
};

export const deleteWebhook = async (req: Request, res: Response): Promise<void> => {
  await Webhook.findByIdAndDelete(req.params.webhookId);
  res.json({ success: true });
};
