import { Request, Response } from "express";
import crypto from "crypto";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { User } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  getRefreshTokenExpiry,
} from "../utils/jwt";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSuspiciousLoginEmail,
  sendAccountLockedEmail,
} from "../utils/email";
import { AppError } from "../middleware/errorHandler";
import { config } from "../config/env";
import { getRecentAccounts, setRecentAccounts } from "../utils/recentAccounts";
import { buildSessionMeta, hashIp, extractIp } from "../utils/session";
import { logAudit } from "../services/auditService";
import { dispatchWebhook } from "../services/webhookService";

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

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new AppError("Email already registered", 409);
  const verificationToken = generateRandomToken();
  const user = await User.create({
    name,
    email,
    password,
    verificationToken,
    verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await sendVerificationEmail(email, verificationToken);
  await logAudit({ userId: user._id.toString(), action: "user.register", req });
  res
    .status(201)
    .json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      userId: user._id,
    });
};

// GET /api/auth/verify-email/:token
export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.params;
  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: new Date() },
  }).select("+verificationToken +verificationTokenExpiry");
  if (!user) throw new AppError("Invalid or expired verification token", 400);
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();
  await logAudit({
    userId: user._id.toString(),
    action: "user.verify_email",
    req,
  });
  try {
    const sessionMeta = await buildSessionMeta(req);
    const refreshToken = generateRefreshToken(user._id.toString());
    await RefreshToken.create({
      token: refreshToken,
      userId: user._id,
      expiresAt: getRefreshTokenExpiry(),
      ...sessionMeta,
    });
    // [MODIFIED] Include sessionVersion in access token
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion, // new
    });
    setTokenCookies(res, accessToken, refreshToken);
    setRecentAccounts(res, user.email, getRecentAccounts(req));
    res.json({ success: true, message: "Email verified successfully." });
  } catch {
    res.json({ success: true, message: "Email verified. Please log in." });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, totpCode } = req.body;
  const user = await User.findOne({ email }).select(
    "+password +twoFactorSecret +twoFactorBackupCodes",
  );

  if (!user || !(await user.comparePassword(password))) {
    // Increment login attempts
    if (user) {
      await user.incrementLoginAttempts();
      if (user.isLocked()) {
        await sendAccountLockedEmail(user.email, user.name);
        await logAudit({
          userId: user._id.toString(),
          action: "user.account_locked",
          req,
        });
      }
    }
    throw new AppError("Invalid email or password", 401);
  }

  if (user.isLocked())
    throw new AppError(
      "Account temporarily locked. Try again in 30 minutes or reset your password.",
      403,
    );
  if (!user.isVerified)
    throw new AppError("Please verify your email before logging in", 403);
  if (user.isSuspended)
    throw new AppError("Account suspended. Contact support.", 403);

  // --- 2FA check ---
  if (user.twoFactorEnabled) {
    if (!totpCode) throw new AppError("2FA code required", 428); // 428 Precondition Required
    const secret = user.twoFactorSecret!;
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: totpCode,
      window: 1,
    });
    if (!verified) {
      // Try backup codes
      const idx = (user.twoFactorBackupCodes || []).indexOf(totpCode);
      if (idx === -1) throw new AppError("Invalid 2FA code", 401);
      user.twoFactorBackupCodes!.splice(idx, 1);
      await user.save();
    }
  }

  await user.resetLoginAttempts();

  // --- Suspicious login detection ---
  const ip = extractIp(req);
  const ipHash = hashIp(ip);
  const isNewDevice = !user.knownIpHashes.includes(ipHash);
  if (isNewDevice && user.emailPreferences?.loginNotifications) {
    const sessionMeta = await buildSessionMeta(req);
    await sendSuspiciousLoginEmail(user.email, user.name, {
      ip: ip || "Unknown",
      device: sessionMeta.deviceName,
      time: new Date().toLocaleString(),
    });
    user.knownIpHashes = [...(user.knownIpHashes || []).slice(-19), ipHash];
    await user.save();
    await logAudit({
      userId: user._id.toString(),
      action: "user.suspicious_login",
      req,
      metadata: { ip: ipHash },
    });
  }

  const sessionMeta = await buildSessionMeta(req);
  // [MODIFIED] Include sessionVersion in access token
  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    sessionVersion: user.sessionVersion, // new
  });
  const refreshToken = generateRefreshToken(user._id.toString());
  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt: getRefreshTokenExpiry(),
    ...sessionMeta,
  });
  setTokenCookies(res, accessToken, refreshToken);
  setRecentAccounts(res, user.email, getRecentAccounts(req));

  await logAudit({ userId: user._id.toString(), action: "user.login", req });
  dispatchWebhook(undefined, "user.login", {
    userId: user._id.toString(),
    email: user.email,
  }).catch(() => {});

  res.json({
    success: true,
    message: "Login successful",
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role,avatar:user.avatar },
  });
};

// POST /api/auth/refresh
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError("Refresh token required", 401);
  const payload = verifyRefreshToken(token);
  const storedToken = await RefreshToken.findOne({ token, isRevoked: false });
  if (!storedToken || storedToken.expiresAt < new Date())
    throw new AppError("Invalid or expired refresh token", 401);
  const user = await User.findById(payload.userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.isSuspended) throw new AppError("Account suspended", 403);
  storedToken.isRevoked = true;
  await storedToken.save();
  const sessionMeta = await buildSessionMeta(req);
  // [MODIFIED] Include latest sessionVersion
  const newAccessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    sessionVersion: user.sessionVersion, // new
  });
  const newRefreshToken = generateRefreshToken(user._id.toString());
  await RefreshToken.create({
    token: newRefreshToken,
    userId: user._id,
    expiresAt: getRefreshTokenExpiry(),
    ...sessionMeta,
  });
  setTokenCookies(res, newAccessToken, newRefreshToken);
  res.json({ success: true, message: "Tokens refreshed",accessToken: newAccessToken });
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken;
  if (token) await RefreshToken.updateOne({ token }, { isRevoked: true });
  const opts = cookieOptions();
  res.clearCookie("accessToken", opts);
  res.clearCookie("refreshToken", opts);
  if (req.user) {
    await logAudit({ userId: req.user.userId, action: "user.logout", req });
    dispatchWebhook(undefined, "user.logout", {
      userId: req.user.userId,
    }).catch(() => {});
  }
  res.json({ success: true, message: "Logged out successfully" });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const resetToken = generateRandomToken();
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    await sendPasswordResetEmail(email, resetToken);
  }
  res.json({
    success: true,
    message: "If that email exists, a reset link has been sent.",
  });
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.params;
  const { password } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpiry");
  if (!user) throw new AppError("Invalid or expired reset token", 400);
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();
  await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });
  await logAudit({
    userId: user._id.toString(),
    action: "user.password_reset",
    req,
  });
  res.json({
    success: true,
    message: "Password reset successfully. You can now log in.",
  });
};

// POST /api/auth/resend-verification
export const resendVerification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.isVerified) {
    res.json({
      success: true,
      message: "If that email exists and is unverified, a link has been sent.",
    });
    return;
  }
  user.verificationToken = generateRandomToken();
  user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  await sendVerificationEmail(email, user.verificationToken);
  res.json({ success: true, message: "Verification email resent." });
};

// POST /api/auth/2fa/setup — Generate TOTP secret + QR
export const setup2FA = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.user?.userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.twoFactorEnabled) throw new AppError("2FA already enabled", 400);
  const secret = speakeasy.generateSecret({
    name: `UnoAccess (${user.email})`,
    issuer: "UnoAccess",
  });
  // Store pending secret in cache (confirmed on verify)
  const { getCache } = await import("../services/cacheService");
  await getCache().set(`2fa_pending:${user._id}`, secret.base32, 300);
  const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url!);
  res.json({ success: true, qrDataUrl, secret: secret.base32 });
};

// POST /api/auth/2fa/verify — Confirm TOTP and enable
export const verify2FA = async (req: Request, res: Response): Promise<void> => {
  const { token: totpToken } = req.body;
  const user = await User.findById(req.user?.userId).select(
    "+twoFactorSecret +twoFactorBackupCodes",
  );
  if (!user) throw new AppError("User not found", 404);
  const { getCache } = await import("../services/cacheService");
  const pendingSecret = await getCache().get<string>(`2fa_pending:${user._id}`);
  if (!pendingSecret)
    throw new AppError("No pending 2FA setup. Start setup again.", 400);
  const verified = speakeasy.totp.verify({
    secret: pendingSecret,
    encoding: "base32",
    token: totpToken,
    window: 1,
  });
  if (!verified) throw new AppError("Invalid code. Try again.", 400);
  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase(),
  );
  user.twoFactorSecret = pendingSecret;
  user.twoFactorEnabled = true;
  user.twoFactorBackupCodes = backupCodes;
  await user.save();
  await getCache().del(`2fa_pending:${user._id}`);
  await logAudit({
    userId: user._id.toString(),
    action: "user.2fa_enable",
    req,
  });
  const { sendTwoFactorBackupEmail } = await import("../utils/email");
  await sendTwoFactorBackupEmail(user.email, user.name, backupCodes);
  res.json({
    success: true,
    message: "2FA enabled. Backup codes sent to your email.",
    backupCodes,
  });
};

// DELETE /api/auth/2fa — Disable 2FA
export const disable2FA = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { password } = req.body;
  const user = await User.findById(req.user?.userId).select(
    "+password +twoFactorSecret +twoFactorBackupCodes",
  );
  if (!user) throw new AppError("User not found", 404);
  const match = await user.comparePassword(password);
  if (!match) throw new AppError("Incorrect password", 401);
  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = [];
  await user.save();
  await logAudit({
    userId: user._id.toString(),
    action: "user.2fa_disable",
    req,
  });
  const { send2FADisabledEmail } = await import("../utils/email");
  await send2FADisabledEmail(user.email, user.name);
  res.json({ success: true, message: "2FA disabled." });
};