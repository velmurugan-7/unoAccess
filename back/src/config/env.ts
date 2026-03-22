import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

const extraOrigins = (process.env.EXTRA_ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  allowedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3001', 'http://localhost:3002',
    ...extraOrigins,
  ],
  mongoUri: required('MONGODB_URI'),
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  encryptionKey: required('ENCRYPTION_KEY'),
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'UnoAccess <noreply@unoaccess.com>',
  },
  cookieSecret: process.env.COOKIE_SECRET || 'cookie-secret-change-me',
  ipHashSalt: process.env.IP_HASH_SALT || 'ip-hash-salt-change-me',
  sentryDsn: process.env.SENTRY_DSN || '',
  isProduction: process.env.NODE_ENV === 'production',
};
