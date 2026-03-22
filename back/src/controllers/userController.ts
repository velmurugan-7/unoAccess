// import { Request, Response } from 'express';
// import path from 'path';
// import fs from 'fs';
// import { User } from '../models/User';
// import { AccessToken } from '../models/AccessToken';
// import { OAuthClient } from '../models/OAuthClient';
// import { RefreshToken } from '../models/RefreshToken';
// import { AuditLog } from '../models/AuditLog';
// import { Announcement } from '../models/Announcement';
// import { AppError } from '../middleware/errorHandler';
// import { logAudit } from '../services/auditService';
// import { getRecentAccounts, setRecentAccounts } from '../utils/recentAccounts';

// export const getProfile = async (req: Request, res: Response): Promise<void> => {
//   const user = await User.findById(req.user?.userId);
//   if (!user) throw new AppError('User not found', 404);
//   res.json({ success: true, user });
// };

// export const updateProfile = async (req: Request, res: Response): Promise<void> => {
//   const { name, email } = req.body;
//   const user = await User.findById(req.user?.userId);
//   if (!user) throw new AppError('User not found', 404);
//   if (email && email !== user.email) {
//     const existing = await User.findOne({ email });
//     if (existing) throw new AppError('Email already in use', 409);
//     user.email = email;
//     user.isVerified = false;
//   }
//   if (name) user.name = name;
//   await user.save();
//   await logAudit({ userId: user._id.toString(), action: 'user.profile_update', req });
//   res.json({ success: true, message: 'Profile updated', user });
// };

// export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
//   const user = await User.findById(req.user?.userId);
//   if (!user) throw new AppError('User not found', 404);
//   // Multer attaches file info to req.file
//   const file = (req as any).file;
//   if (!file) throw new AppError('No file uploaded', 400);
//   // Store as base64 data URL (for simplicity — in prod use S3)
//   const base64 = file.buffer.toString('base64');
//   const dataUrl = `data:${file.mimetype};base64,${base64}`;
//   user.avatarUrl = dataUrl;
//   await user.save();
//   res.json({ success: true, avatarUrl: dataUrl });
// };

// export const changePassword = async (req: Request, res: Response): Promise<void> => {
//   const { currentPassword, newPassword } = req.body;
//   const user = await User.findById(req.user?.userId).select('+password');
//   if (!user) throw new AppError('User not found', 404);
//   if (!(await user.comparePassword(currentPassword))) throw new AppError('Current password is incorrect', 401);
//   user.password = newPassword;
//   await user.save();
//   await logAudit({ userId: user._id.toString(), action: 'user.password_change', req });
//   res.json({ success: true, message: 'Password changed successfully' });
// };

// export const getConnectedApps = async (req: Request, res: Response): Promise<void> => {
//   const tokens = await AccessToken.find({ userId: req.user?.userId, isRevoked: false, expiresAt: { $gt: new Date() } });
//   const clientIds = [...new Set(tokens.map((t) => t.clientId))];
//   const clients = await OAuthClient.find({ clientId: { $in: clientIds } });
//   res.json({ success: true, connectedApps: clients });
// };

// export const revokeAppAccess = async (req: Request, res: Response): Promise<void> => {
//   const { clientId } = req.params;
//   await AccessToken.updateMany({ userId: req.user?.userId, clientId }, { isRevoked: true });
//   await logAudit({ userId: req.user?.userId, action: 'oauth.access_revoked', resourceId: clientId, req });
//   res.json({ success: true, message: 'Access revoked' });
// };

// export const updateRecentAccount = async (req: Request, res: Response): Promise<void> => {
//   const { email } = req.body;
//   if (!email || typeof email !== 'string') throw new AppError('email is required', 400);
//   const existing = getRecentAccounts(req);
//   setRecentAccounts(res, email, existing);
//   res.json({ success: true });
// };

// export const getSessions = async (req: Request, res: Response): Promise<void> => {
//   const currentRefreshToken = req.cookies?.refreshToken;
//   const sessions = await RefreshToken.find({ userId: req.user?.userId, isRevoked: false, expiresAt: { $gt: new Date() } }).sort({ lastActiveAt: -1 });
//   const result = sessions.map((s) => ({
//     id: s._id, deviceName: s.deviceName, browser: s.browser, os: s.os,
//     deviceType: s.deviceType, country: s.country, city: s.city, flag: s.flag,
//     lastActiveAt: s.lastActiveAt, createdAt: s.createdAt, isCurrent: s.token === currentRefreshToken,
//   }));
//   res.json({ success: true, sessions: result });
// };

// export const revokeSession = async (req: Request, res: Response): Promise<void> => {
//   const { sessionId } = req.params;
//   const currentRefreshToken = req.cookies?.refreshToken;
//   const session = await RefreshToken.findOne({ _id: sessionId, userId: req.user?.userId, isRevoked: false });
//   if (!session) throw new AppError('Session not found', 404);
//   if (session.token === currentRefreshToken) throw new AppError('Use /api/auth/logout to end your current session', 400);
//   session.isRevoked = true;
//   await session.save();
//   await logAudit({ userId: req.user?.userId, action: 'user.session_revoke', req });
//   res.json({ success: true, message: 'Session revoked' });
// };

// export const revokeAllOtherSessions = async (req: Request, res: Response): Promise<void> => {
//   const currentRefreshToken = req.cookies?.refreshToken;
//   await RefreshToken.updateMany({ userId: req.user?.userId, token: { $ne: currentRefreshToken }, isRevoked: false }, { isRevoked: true });
//   res.json({ success: true, message: 'All other sessions signed out' });
// };

// export const getEmailPreferences = async (req: Request, res: Response): Promise<void> => {
//   const user = await User.findById(req.user?.userId);
//   if (!user) throw new AppError('User not found', 404);
//   res.json({ success: true, preferences: user.emailPreferences });
// };

// export const updateEmailPreferences = async (req: Request, res: Response): Promise<void> => {
//   const user = await User.findById(req.user?.userId);
//   if (!user) throw new AppError('User not found', 404);
//   const { securityAlerts, loginNotifications, productUpdates, weeklyDigest } = req.body;
//   user.emailPreferences = {
//     securityAlerts: securityAlerts ?? user.emailPreferences.securityAlerts,
//     loginNotifications: loginNotifications ?? user.emailPreferences.loginNotifications,
//     productUpdates: productUpdates ?? user.emailPreferences.productUpdates,
//     weeklyDigest: weeklyDigest ?? user.emailPreferences.weeklyDigest,
//   };
//   await user.save();
//   res.json({ success: true, message: 'Preferences updated', preferences: user.emailPreferences });
// };

// export const getAuditLog = async (req: Request, res: Response): Promise<void> => {
//   const page = parseInt(req.query.page as string) || 1;
//   const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
//   const skip = (page - 1) * limit;
//   const logs = await AuditLog.find({ userId: req.user?.userId }).sort({ timestamp: -1 }).skip(skip).limit(limit);
//   const total = await AuditLog.countDocuments({ userId: req.user?.userId });
//   res.json({ success: true, logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
// };

// export const getAnnouncements = async (_req: Request, res: Response): Promise<void> => {
//   const now = new Date();
//   const announcements = await Announcement.find({
//     isActive: true,
//     $or: [{ expiresAt: { $gt: now } }, { expiresAt: { $exists: false } }],
//   }).sort({ createdAt: -1 }).limit(5);
//   res.json({ success: true, announcements });
// };

import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { User } from "../models/User";
import { AccessToken } from "../models/AccessToken";
import { OAuthClient } from "../models/OAuthClient";
import { RefreshToken } from "../models/RefreshToken";
import { AuditLog } from "../models/AuditLog";
import { Announcement } from "../models/Announcement";
import { AppError } from "../middleware/errorHandler";
import { logAudit } from "../services/auditService";
import { getRecentAccounts, setRecentAccounts } from "../utils/recentAccounts";
import { generateAccessToken } from "../utils/jwt";
import { config } from "../config/env";

// Replicate cookie options from authController (or move to shared utility later)
const cookieOptions = () => ({
  httpOnly: true,
  secure: config.isProduction,
  sameSite: "lax" as const,
  ...(config.isProduction ? {} : { domain: "localhost" }),
});

const setTokenCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  const opts = cookieOptions();
  res.cookie("accessToken", accessToken, { ...opts, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, {
    ...opts,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const getProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = await User.findById(req.user?.userId);
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, user });
};

export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name, email } = req.body;
  const user = await User.findById(req.user?.userId);
  if (!user) throw new AppError("User not found", 404);
  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) throw new AppError("Email already in use", 409);
    user.email = email;
    user.isVerified = false;
  }
  if (name) user.name = name;
  await user.save();
  await logAudit({
    userId: user._id.toString(),
    action: "user.profile_update",
    req,
  });
  res.json({ success: true, message: "Profile updated", user });
};

export const uploadAvatar = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = await User.findById(req.user?.userId);
  if (!user) throw new AppError("User not found", 404);
  // Multer attaches file info to req.file
  const file = (req as any).file;
  if (!file) throw new AppError("No file uploaded", 400);
  // Store as base64 data URL (for simplicity — in prod use S3)
  const base64 = file.buffer.toString("base64");
  const dataUrl = `data:${file.mimetype};base64,${base64}`;
  user.avatarUrl = dataUrl;
  await user.save();
  res.json({ success: true, avatarUrl: dataUrl });
};

export const changePassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user?.userId).select("+password");
  if (!user) throw new AppError("User not found", 404);
  if (!(await user.comparePassword(currentPassword)))
    throw new AppError("Current password is incorrect", 401);
  user.password = newPassword;
  await user.save();
  await logAudit({
    userId: user._id.toString(),
    action: "user.password_change",
    req,
  });
  res.json({ success: true, message: "Password changed successfully" });
};

export const getConnectedApps = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tokens = await AccessToken.find({
    userId: req.user?.userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });
  const clientIds = [...new Set(tokens.map((t) => t.clientId))];
  const clients = await OAuthClient.find({ clientId: { $in: clientIds } });
  res.json({ success: true, connectedApps: clients });
};

export const revokeAppAccess = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { clientId } = req.params;
  await AccessToken.updateMany(
    { userId: req.user?.userId, clientId },
    { isRevoked: true },
  );
  await logAudit({
    userId: req.user?.userId,
    action: "oauth.access_revoked",
    resourceId: clientId,
    req,
  });
  res.json({ success: true, message: "Access revoked" });
};

export const updateRecentAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;
  if (!email || typeof email !== "string")
    throw new AppError("email is required", 400);
  const existing = getRecentAccounts(req);
  setRecentAccounts(res, email, existing);
  res.json({ success: true });
};

export const getSessions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const currentRefreshToken = req.cookies?.refreshToken;
  const sessions = await RefreshToken.find({
    userId: req.user?.userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).sort({ lastActiveAt: -1 });
  const result = sessions.map((s) => ({
    id: s._id,
    deviceName: s.deviceName,
    browser: s.browser,
    os: s.os,
    deviceType: s.deviceType,
    country: s.country,
    city: s.city,
    flag: s.flag,
    lat: s.lat ?? 0, // ← new
    lng: s.lng ?? 0, // ← new
    lastActiveAt: s.lastActiveAt,
    createdAt: s.createdAt,
    isCurrent: s.token === currentRefreshToken,
  }));
  res.json({ success: true, sessions: result });
};

export const revokeSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { sessionId } = req.params;
  const currentRefreshToken = req.cookies?.refreshToken;
  const session = await RefreshToken.findOne({
    _id: sessionId,
    userId: req.user?.userId,
    isRevoked: false,
  });
  if (!session) throw new AppError("Session not found", 404);
  if (session.token === currentRefreshToken)
    throw new AppError("Use /api/auth/logout to end your current session", 400);
  session.isRevoked = true;
  await session.save();
  await logAudit({
    userId: req.user?.userId,
    action: "user.session_revoke",
    req,
  });
  res.json({ success: true, message: "Session revoked" });
};

// [MODIFIED] Revoke all other sessions and increment sessionVersion
export const revokeAllOtherSessions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const currentRefreshToken = req.cookies?.refreshToken;
  const userId = req.user?.userId;

  // Revoke all other refresh tokens
  await RefreshToken.updateMany(
    { userId, token: { $ne: currentRefreshToken }, isRevoked: false },
    { isRevoked: true },
  );

  // Increment user's sessionVersion to invalidate all existing access tokens (except current)
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  user.sessionVersion += 1;
  await user.save();

  // Generate a new access token with the updated version for the current session
  const newAccessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    sessionVersion: user.sessionVersion,
  });

  // Set the new access token cookie (refresh token remains the same)
  const opts = cookieOptions();
  res.cookie("accessToken", newAccessToken, {
    ...opts,
    maxAge: 15 * 60 * 1000,
  });

  await logAudit({ userId, action: "user.revoke_all_sessions", req });
  res.json({
    success: true,
    message:
      "All other sessions signed out. Your current session remains active.",
  });
};

export const getEmailPreferences = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = await User.findById(req.user?.userId);
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, preferences: user.emailPreferences });
};

export const updateEmailPreferences = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = await User.findById(req.user?.userId);
  if (!user) throw new AppError("User not found", 404);
  const { securityAlerts, loginNotifications, productUpdates, weeklyDigest } =
    req.body;
  user.emailPreferences = {
    securityAlerts: securityAlerts ?? user.emailPreferences.securityAlerts,
    loginNotifications:
      loginNotifications ?? user.emailPreferences.loginNotifications,
    productUpdates: productUpdates ?? user.emailPreferences.productUpdates,
    weeklyDigest: weeklyDigest ?? user.emailPreferences.weeklyDigest,
  };
  await user.save();
  res.json({
    success: true,
    message: "Preferences updated",
    preferences: user.emailPreferences,
  });
};

export const getAuditLog = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const skip = (page - 1) * limit;
  const logs = await AuditLog.find({ userId: req.user?.userId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
  const total = await AuditLog.countDocuments({ userId: req.user?.userId });
  res.json({
    success: true,
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

export const getAnnouncements = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const now = new Date();
  const announcements = await Announcement.find({
    isActive: true,
    $or: [{ expiresAt: { $gt: now } }, { expiresAt: { $exists: false } }],
  })
    .sort({ createdAt: -1 })
    .limit(5);
  res.json({ success: true, announcements });
};
// ── Audit Log Export ───────────────────────────────────────────────────────
export const exportAuditLog = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { format = "json" } = req.query as { format?: string };
  const logs = await AuditLog.find({ userId: req.user!.userId })
    .sort({ timestamp: -1 })
    .limit(5000)
    .lean();

  if (format === "csv") {
    const header = "action,timestamp,ip,userAgent,success\n";
    const rows = logs
      .map((l) =>
        [
          l.action,
          l.timestamp?.toISOString() || "",
          l.ip || "",
          `"${(l.userAgent || "").replace(/"/g, "'")}"`,
          l.success,
        ].join(","),
      )
      .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="audit-log.csv"',
    );
    res.send(header + rows);
  } else {
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="audit-log.json"',
    );
    res.json(logs);
  }
};
