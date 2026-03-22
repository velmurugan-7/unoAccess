import { Request, Response } from 'express';
import { OAuthClient } from '../models/OAuthClient';
import { AuthorizationCode } from '../models/AuthorizationCode';
import { AccessToken } from '../models/AccessToken';
import { UserConsent } from '../models/UserConsent';
import { User } from '../models/User';
import { decrypt } from '../utils/encryption';
import { AppError } from '../middleware/errorHandler';
import { generateRandomToken, verifyAccessToken } from '../utils/jwt';
import { getRecentAccounts } from '../utils/recentAccounts';
import { config } from '../config/env';
import jwt from 'jsonwebtoken';

const SUPPORTED_SCOPES = ['openid', 'profile', 'email'];

// GET /oauth/authorize
// export const getAuthorize = async (req: Request, res: Response): Promise<void> => {
//   const { client_id, redirect_uri, scope, state, response_type, prompt, login_hint } =
//     req.query as Record<string, string>;

//   if (response_type !== 'code') throw new AppError('Only authorization_code grant supported', 400);
//   if (!client_id || !redirect_uri) throw new AppError('client_id and redirect_uri are required', 400);

//   const client = await OAuthClient.findOne({ clientId: client_id, isActive: true });
//   if (!client) throw new AppError('Unknown client', 400);
//   if (!client.redirectUris.includes(redirect_uri)) throw new AppError('Invalid redirect_uri', 400);

//   const requestedScopes = (scope || 'openid').split(' ').filter((s) => SUPPORTED_SCOPES.includes(s));

//   // Resolve authenticated user from cookie
//   const accessTokenCookie = req.cookies?.accessToken;
//   let activePayload: { userId: string; email: string; role: string } | null = null;
//   if (accessTokenCookie) {
//     try { activePayload = verifyAccessToken(accessTokenCookie); } catch { /* expired */ }
//   }

//   // Handle login_hint: switch account if needed
//   if (login_hint) {
//     if (activePayload?.email !== login_hint) {
//       const hintUser = await User.findOne({ email: login_hint });
//       const oauthParams = new URLSearchParams({
//         client_id, redirect_uri, scope: requestedScopes.join(' '), state: state || '', response_type,
//       });
//       if (!hintUser) {
//         const loginUrl = `${config.frontendUrl}/login?email=${encodeURIComponent(login_hint)}&redirect=${encodeURIComponent(`/oauth/authorize?${oauthParams.toString()}`)}`;
//         res.redirect(loginUrl);
//         return;
//       }
//       res.clearCookie('accessToken');
//       res.clearCookie('refreshToken');
//       const loginUrl = `${config.frontendUrl}/login?email=${encodeURIComponent(login_hint)}&redirect=${encodeURIComponent(`/oauth/authorize?${oauthParams.toString()}`)}`;
//       res.redirect(loginUrl);
//       return;
//     }
//   }

//   // Handle prompt=select_account
//   if (prompt === 'select_account') {
//     const recentEmails = getRecentAccounts(req);
//     const accounts = Array.from(new Set([...(activePayload ? [activePayload.email] : []), ...recentEmails])).slice(0, 5);
//     if (accounts.length > 0) {
//       const oauthParams = new URLSearchParams({
//         client_id, redirect_uri, scope: requestedScopes.join(' '), state: state || '', response_type,
//       });
//       const chooserUrl = `${config.frontendUrl}/account-chooser?${oauthParams.toString()}&accounts=${encodeURIComponent(JSON.stringify(accounts))}`;
//       res.redirect(chooserUrl);
//       return;
//     }
//   }

//   // Redirect to login if not authenticated
//   if (!activePayload) {
//     const loginUrl = `${config.frontendUrl}/login?redirect=${encodeURIComponent(req.originalUrl)}`;
//     res.redirect(loginUrl);
//     return;
//   }

//   // Check existing consent
//   try {
//     const existingConsent = await UserConsent.findOne({
//       userId: activePayload.userId,
//       clientId: client._id,
//       scope: { $all: requestedScopes, $size: requestedScopes.length },
//     });
//     if (existingConsent) {
//       const code = generateRandomToken();
//       await AuthorizationCode.create({
//         code, clientId: client._id, userId: activePayload.userId,
//         redirectUri: redirect_uri, scope: requestedScopes,
//         expiresAt: new Date(Date.now() + 10 * 60 * 1000),
//       });
//       const url = new URL(redirect_uri);
//       url.searchParams.set('code', code);
//       if (state) url.searchParams.set('state', state);
//       res.redirect(url.toString());
//       return;
//     }
//   } catch (err) {
//     console.error('Consent query error:', err);
//   }

//   // Show consent page
//   const consentQuery = new URLSearchParams({
//     client_id, redirect_uri, scope: requestedScopes.join(' '), state: state || '',
//     response_type, client_name: client.name,
//     client_logo: client.logoUrl || '', website: client.website || '',
//   }).toString();
//   res.redirect(`${config.frontendUrl}/oauth/authorize?${consentQuery}`);
// };
export const getAuthorize = async (req: Request, res: Response): Promise<void> => {
  const { client_id, redirect_uri, scope, state, response_type, prompt, login_hint } =
    req.query as Record<string, string>;

  if (response_type !== 'code') throw new AppError('Only authorization_code grant supported', 400);
  if (!client_id || !redirect_uri) throw new AppError('client_id and redirect_uri are required', 400);

  const client = await OAuthClient.findOne({ clientId: client_id, isActive: true });
  if (!client) throw new AppError('Unknown client', 400);
  if (!client.redirectUris.includes(redirect_uri)) throw new AppError('Invalid redirect_uri', 400);

  const requestedScopes = (scope || 'openid').split(' ').filter((s) => SUPPORTED_SCOPES.includes(s));

  // Resolve authenticated user from cookie
  const accessTokenCookie = req.cookies?.accessToken;
  let activePayload: { userId: string; email: string; role: string } | null = null;
  if (accessTokenCookie) {
    try { activePayload = verifyAccessToken(accessTokenCookie); } catch { /* expired */ }
  }

  // Handle login_hint: switch account if needed
  if (login_hint) {
    if (activePayload?.email !== login_hint) {
      const hintUser = await User.findOne({ email: login_hint });
      const oauthParams = new URLSearchParams({
        client_id, redirect_uri, scope: requestedScopes.join(' '), state: state || '', response_type,
      });
      if (!hintUser) {
        const loginUrl = `${config.frontendUrl}/login?email=${encodeURIComponent(login_hint)}&redirect=${encodeURIComponent(`/oauth/authorize?${oauthParams.toString()}`)}`;
        res.redirect(loginUrl);
        return;
      }
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      const loginUrl = `${config.frontendUrl}/login?email=${encodeURIComponent(login_hint)}&redirect=${encodeURIComponent(`/oauth/authorize?${oauthParams.toString()}`)}`;
      res.redirect(loginUrl);
      return;
    }
  }

  // Handle prompt=select_account – show account chooser (but no consent)
  if (prompt === 'select_account' && !login_hint) {
    const recentEmails = getRecentAccounts(req);
    const accounts = Array.from(new Set([...(activePayload ? [activePayload.email] : []), ...recentEmails])).slice(0, 5);
    if (accounts.length > 0) {
      const oauthParams = new URLSearchParams({
        client_id, redirect_uri, scope: requestedScopes.join(' '), state: state || '', response_type,
      });
      const chooserUrl = `${config.frontendUrl}/account-chooser?${oauthParams.toString()}&accounts=${encodeURIComponent(JSON.stringify(accounts))}`;
      res.redirect(chooserUrl);
      return;
    }
  }

  // Redirect to login if not authenticated
  if (!activePayload) {
    const loginUrl = `${config.frontendUrl}/login?redirect=${encodeURIComponent(req.originalUrl)}`;
    res.redirect(loginUrl);
    return;
  }

  // ===== AUTO-APPROVE: generate code immediately (no consent page) =====
  // Save or update consent for future approvals
  try {
    await UserConsent.findOneAndUpdate(
      { userId: activePayload.userId, clientId: client._id },
      { scope: requestedScopes, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Failed to save consent:', err);
    // proceed anyway
  }

  const code = generateRandomToken();
  await AuthorizationCode.create({
    code,
    clientId: client._id,
    userId: activePayload.userId,
    redirectUri: redirect_uri,
    scope: requestedScopes,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const url = new URL(redirect_uri);
  url.searchParams.set('code', code);
  if (state) url.searchParams.set('state', state);
  res.redirect(url.toString());
};

// POST /oauth/authorize
// export const postAuthorize = async (req: Request, res: Response): Promise<void> => {
//   const { client_id, redirect_uri, scope, state, approved, response_type } = req.body;

//   if (response_type && response_type !== 'code') throw new AppError('Only authorization_code grant supported', 400);

//   if (!(approved === true || approved === 'true')) {
//     const url = new URL(redirect_uri);
//     url.searchParams.set('error', 'access_denied');
//     if (state) url.searchParams.set('state', state);
//     res.json({ success: true, redirectUrl: url.toString() });
//     return;
//   }

//   const client = await OAuthClient.findOne({ clientId: client_id, isActive: true });
//   if (!client) throw new AppError('Invalid client', 400);
//   if (!client.redirectUris.includes(redirect_uri)) throw new AppError('Invalid redirect_uri', 400);

//   const accessToken = req.cookies?.accessToken;
//   if (!accessToken) throw new AppError('Not authenticated', 401);

//   const payload = verifyAccessToken(accessToken);
//   const requestedScopes = (scope || 'openid').split(' ');
//   const code = generateRandomToken();

//   await AuthorizationCode.create({
//     code, clientId: client._id, userId: payload.userId,
//     redirectUri: redirect_uri, scope: requestedScopes,
//     expiresAt: new Date(Date.now() + 10 * 60 * 1000),
//   });

//   await UserConsent.findOneAndUpdate(
//     { userId: payload.userId, clientId: client._id },
//     { scope: requestedScopes, updatedAt: new Date() },
//     { upsert: true, new: true }
//   );

//   const url = new URL(redirect_uri);
//   url.searchParams.set('code', code);
//   if (state) url.searchParams.set('state', state);
//   res.json({ success: true, redirectUrl: url.toString() });
// };

// POST /oauth/token
export const tokenExchange = async (req: Request, res: Response): Promise<void> => {
  const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;

  if (grant_type !== 'authorization_code') throw new AppError('Unsupported grant_type', 400);

  const client = await OAuthClient.findOne({ clientId: client_id });
  if (!client) throw new AppError('Invalid client_id', 401);

  if (decrypt(client.clientSecret) !== client_secret) throw new AppError('Invalid client_secret', 401);

  const authCode = await AuthorizationCode.findOne({
    code, clientId: client._id, redirectUri: redirect_uri, isUsed: false, expiresAt: { $gt: new Date() },
  });
  if (!authCode) throw new AppError('Invalid or expired authorization code', 400);

  authCode.isUsed = true;
  await authCode.save();

  const user = await User.findById(authCode.userId);
  if (!user) throw new AppError('User not found', 404);

  const accessTokenValue = generateRandomToken();
  const expiresIn = 3600;
  await AccessToken.create({
    token: accessTokenValue, clientId: client_id, userId: user._id,
    scope: authCode.scope, expiresAt: new Date(Date.now() + expiresIn * 1000),
  });

  const response: Record<string, unknown> = {
    access_token: accessTokenValue, token_type: 'Bearer', expires_in: expiresIn,
    scope: authCode.scope.join(' '),
  };

  if (authCode.scope.includes('openid')) {
    const idTokenPayload: Record<string, unknown> = {
      iss: config.frontendUrl, sub: user._id.toString(), aud: client_id,
      iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresIn,
    };
    if (authCode.scope.includes('email')) { idTokenPayload.email = user.email; idTokenPayload.email_verified = user.isVerified; }
    if (authCode.scope.includes('profile')) { idTokenPayload.name = user.name; }
    response.id_token = jwt.sign(idTokenPayload, config.jwt.accessSecret);
  }

  res.json(response);
};

// GET /oauth/userinfo
export const userinfo = async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new AppError('Bearer token required', 401);

  const accessToken = await AccessToken.findOne({ token, isRevoked: false, expiresAt: { $gt: new Date() } });
  if (!accessToken) throw new AppError('Invalid or expired access token', 401);

  const user = await User.findById(accessToken.userId);
  if (!user) throw new AppError('User not found', 404);

  const claims: Record<string, unknown> = { sub: user._id.toString() };
  if (accessToken.scope.includes('profile')) claims.name = user.name;
  if (accessToken.scope.includes('email')) { claims.email = user.email; claims.email_verified = user.isVerified; }

  res.json(claims);
};
