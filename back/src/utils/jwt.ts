// import jwt from 'jsonwebtoken';
// import { config } from '../config/env';

// export interface AccessTokenPayload {
//   userId: string;
//   email: string;
//   role: string;
// }

// export const generateAccessToken = (payload: AccessTokenPayload): string => {
//   return jwt.sign(payload, config.jwt.accessSecret, {
//     expiresIn: config.jwt.accessExpiresIn,
//   } as jwt.SignOptions);
// };

// export const verifyAccessToken = (token: string): AccessTokenPayload => {
//   return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
// };

// export const generateRefreshToken = (userId: string): string => {
//   return jwt.sign({ userId }, config.jwt.refreshSecret, {
//     expiresIn: config.jwt.refreshExpiresIn,
//   } as jwt.SignOptions);
// };

// export const verifyRefreshToken = (token: string): { userId: string } => {
//   return jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
// };

// /** Generate a random hex token for email verification / password reset */
// export const generateRandomToken = (): string => {
//   const { randomBytes } = require('crypto');
//   return randomBytes(32).toString('hex');
// };

// /** Get expiry date for refresh token (7 days) */
// export const getRefreshTokenExpiry = (): Date => {
//   const d = new Date();
//   d.setDate(d.getDate() + 7);
//   return d;
// };

import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionVersion?: number; // 👈 added
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
};

/** Generate a random hex token for email verification / password reset */
export const generateRandomToken = (): string => {
  const { randomBytes } = require('crypto');
  return randomBytes(32).toString('hex');
};

/** Get expiry date for refresh token (7 days) */
export const getRefreshTokenExpiry = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
};