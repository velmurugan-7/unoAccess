// /**
//  * userAppController — lets regular users register and manage their own OAuth client.
//  * Each user may have at most 1 app. Uses the existing OAuthClient model unchanged.
//  */
// import { Request, Response } from 'express';
// import { v4 as uuidv4 } from 'uuid';
// import crypto from 'crypto';
// import { OAuthClient } from '../models/OAuthClient';
// import { AppError } from '../middleware/errorHandler';
// import { encrypt, decrypt } from '../utils/encryption';
// import { logAudit } from '../services/auditService';

// // ── GET /api/user/apps ─────────────────────────────────────────────────────────
// export const getUserApp = async (req: Request, res: Response): Promise<void> => {
//   const app = await OAuthClient.findOne({ createdBy: req.user!.userId });
//   if (!app) {
//     res.json({ success: true, app: null });
//     return;
//   }
//   // Never expose the encrypted secret
//   res.json({ success: true, app: { ...app.toJSON(), clientSecret: undefined } });
// };

// // ── POST /api/user/apps ────────────────────────────────────────────────────────
// export const createUserApp = async (req: Request, res: Response): Promise<void> => {
//   // Enforce 1-app limit
//   const existing = await OAuthClient.findOne({ createdBy: req.user!.userId });
//   if (existing) throw new AppError('You already have a registered app. Delete it first to create a new one.', 409);

//   const { name, redirectUris, website, logoUrl } = req.body as {
//     name: string;
//     redirectUris: string[];
//     website?: string;
//     logoUrl?: string;
//   };

//   if (!name?.trim()) throw new AppError('App name is required', 400);
//   if (!Array.isArray(redirectUris) || redirectUris.length === 0) throw new AppError('At least one redirect URI is required', 400);

//   const clientId = `ua_${uuidv4().replace(/-/g, '')}`;
//   const rawSecret = crypto.randomBytes(32).toString('hex');

//   const app = await OAuthClient.create({
//     name: name.trim(),
//     clientId,
//     clientSecret: encrypt(rawSecret),
//     redirectUris,
//     scopes: ['openid', 'profile', 'email'],
//     website: website || undefined,
//     logoUrl: logoUrl || undefined,
//     createdBy: req.user!.userId,
//   });

//   await logAudit({
//     userId: req.user!.userId,
//     action: 'admin.client_create', // reuse existing audit action
//     resourceId: clientId,
//     req,
//   });

//   // Return raw secret once — never stored in plaintext
//   res.status(201).json({
//     success: true,
//     message: 'App registered. Copy the client secret — it will not be shown again.',
//     app: { ...app.toJSON(), clientSecret: rawSecret }, // raw secret shown once
//   });
// };

// // ── PUT /api/user/apps ─────────────────────────────────────────────────────────
// export const updateUserApp = async (req: Request, res: Response): Promise<void> => {
//   const app = await OAuthClient.findOne({ createdBy: req.user!.userId });
//   if (!app) throw new AppError('No registered app found', 404);

//   const { name, redirectUris, website, logoUrl, isActive } = req.body;
//   if (name) app.name = name.trim();
//   if (Array.isArray(redirectUris) && redirectUris.length > 0) app.redirectUris = redirectUris;
//   if (website !== undefined) app.website = website || undefined;
//   if (logoUrl !== undefined) app.logoUrl = logoUrl || undefined;
//   if (typeof isActive === 'boolean') app.isActive = isActive;

//   await app.save();

//   await logAudit({ userId: req.user!.userId, action: 'admin.client_update', resourceId: app.clientId, req });

//   res.json({ success: true, message: 'App updated', app: { ...app.toJSON(), clientSecret: undefined } });
// };

// // ── DELETE /api/user/apps ──────────────────────────────────────────────────────
// export const deleteUserApp = async (req: Request, res: Response): Promise<void> => {
//   const app = await OAuthClient.findOneAndDelete({ createdBy: req.user!.userId });
//   if (!app) throw new AppError('No registered app found', 404);

//   await logAudit({ userId: req.user!.userId, action: 'admin.client_delete', resourceId: app.clientId, req });

//   res.json({ success: true, message: 'App deleted' });
// };

// // ── POST /api/user/apps/rotate-secret ─────────────────────────────────────────
// export const rotateUserAppSecret = async (req: Request, res: Response): Promise<void> => {
//   const app = await OAuthClient.findOne({ createdBy: req.user!.userId });
//   if (!app) throw new AppError('No registered app found', 404);

//   const rawSecret = crypto.randomBytes(32).toString('hex');
//   app.clientSecret = encrypt(rawSecret);
//   await app.save();

//   await logAudit({ userId: req.user!.userId, action: 'admin.secret_rotate', resourceId: app.clientId, req });

//   res.json({
//     success: true,
//     message: 'Secret rotated. Copy it now — shown only once.',
//     clientSecret: rawSecret,
//   });
// };

/**
 * userAppController — lets regular users register and manage their own OAuth client.
 * Each user may have at most 1 self-registered app.
 *
 * KEY FIX: all queries filter by BOTH createdBy AND selfRegistered: true
 * so admin-created apps (selfRegistered: false) are never touched here.
 */
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { OAuthClient } from '../models/OAuthClient';
import { AppError } from '../middleware/errorHandler';
import { encrypt } from '../utils/encryption';
import { logAudit } from '../services/auditService';

// Shared filter — always scope to self-registered apps only
const userAppFilter = (userId: string) => ({
  createdBy: userId,
  selfRegistered: true,
});

// ── GET /api/user/apps ─────────────────────────────────────────────────────────
export const getUserApp = async (req: Request, res: Response): Promise<void> => {
  const app = await OAuthClient.findOne(userAppFilter(req.user!.userId));
  if (!app) {
    res.json({ success: true, app: null });
    return;
  }
  res.json({ success: true, app: { ...app.toJSON(), clientSecret: undefined } });
};

// ── POST /api/user/apps ────────────────────────────────────────────────────────
export const createUserApp = async (req: Request, res: Response): Promise<void> => {
  // Enforce 1-app limit (only counts self-registered apps)
  const existing = await OAuthClient.findOne(userAppFilter(req.user!.userId));
  if (existing) {
    throw new AppError('You already have a registered app. Delete it first to create a new one.', 409);
  }

  const { name, redirectUris, website, logoUrl } = req.body as {
    name: string;
    redirectUris: string[];
    website?: string;
    logoUrl?: string;
  };

  if (!name?.trim()) throw new AppError('App name is required', 400);
  if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
    throw new AppError('At least one redirect URI is required', 400);
  }

  const clientId = `ua_${uuidv4().replace(/-/g, '')}`;
  const rawSecret = crypto.randomBytes(32).toString('hex');

  const app = await OAuthClient.create({
    name: name.trim(),
    clientId,
    clientSecret: encrypt(rawSecret),
    redirectUris,
    scopes: ['openid', 'profile', 'email'],
    website: website || undefined,
    logoUrl: logoUrl || undefined,
    createdBy: req.user!.userId,
    selfRegistered: true, // ← marks it as user-registered, not admin-created
  });

  await logAudit({
    userId: req.user!.userId,
    action: 'admin.client_create',
    resourceId: clientId,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'App registered. Copy the client secret — it will not be shown again.',
    app: { ...app.toJSON(), clientSecret: rawSecret },
  });
};

// ── PUT /api/user/apps ─────────────────────────────────────────────────────────
export const updateUserApp = async (req: Request, res: Response): Promise<void> => {
  const app = await OAuthClient.findOne(userAppFilter(req.user!.userId));
  if (!app) throw new AppError('No registered app found', 404);

  const { name, redirectUris, website, logoUrl, isActive } = req.body;
  if (name) app.name = name.trim();
  if (Array.isArray(redirectUris) && redirectUris.length > 0) app.redirectUris = redirectUris;
  if (website !== undefined) app.website = website || undefined;
  if (logoUrl !== undefined) app.logoUrl = logoUrl || undefined;
  if (typeof isActive === 'boolean') app.isActive = isActive;

  await app.save();

  await logAudit({
    userId: req.user!.userId,
    action: 'admin.client_update',
    resourceId: app.clientId,
    req,
  });

  res.json({ success: true, message: 'App updated', app: { ...app.toJSON(), clientSecret: undefined } });
};

// ── DELETE /api/user/apps ──────────────────────────────────────────────────────
export const deleteUserApp = async (req: Request, res: Response): Promise<void> => {
  // findOneAndDelete with selfRegistered: true — will NEVER touch admin apps
  const app = await OAuthClient.findOneAndDelete(userAppFilter(req.user!.userId));
  if (!app) throw new AppError('No registered app found', 404);

  await logAudit({
    userId: req.user!.userId,
    action: 'admin.client_delete',
    resourceId: app.clientId,
    req,
  });

  res.json({ success: true, message: 'App deleted' });
};

// ── POST /api/user/apps/rotate-secret ─────────────────────────────────────────
export const rotateUserAppSecret = async (req: Request, res: Response): Promise<void> => {
  const app = await OAuthClient.findOne(userAppFilter(req.user!.userId));
  if (!app) throw new AppError('No registered app found', 404);

  const rawSecret = crypto.randomBytes(32).toString('hex');
  app.clientSecret = encrypt(rawSecret);
  await app.save();

  await logAudit({
    userId: req.user!.userId,
    action: 'admin.secret_rotate',
    resourceId: app.clientId,
    req,
  });

  res.json({
    success: true,
    message: 'Secret rotated. Copy it now — shown only once.',
    clientSecret: rawSecret,
  });
};