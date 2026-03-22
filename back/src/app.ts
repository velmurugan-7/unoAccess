import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import oauthRoutes from './routes/oauth';
import monitoringRoutes from './routes/monitoring';
import statusRoutes from './routes/status';
import { logger } from './utils/logger';
import { getAllowedOrigins } from './services/originService';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...config.allowedOrigins],
    },
  },
}));

app.use(cors({
  origin: async (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.allowedOrigins.includes(origin)) return callback(null, true);
    try {
      const dynamicOrigins = await getAllowedOrigins();
      if (dynamicOrigins.has(origin)) return callback(null, true);
    } catch (err) {
      logger.error('Error checking dynamic origins:', err);
      return callback(new Error('CORS check failed'));
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

app.use(requestId);
app.use(generalLimiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(config.cookieSecret));

// Health endpoints
app.get('/health/live', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/health/ready', async (_req, res) => {
  try {
    const mongoose = await import('mongoose');
    const dbState = mongoose.default.connection.readyState;
    const ready = dbState === 1;
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', db: ready ? 'connected' : 'disconnected', timestamp: new Date().toISOString() });
  } catch { res.status(503).json({ status: 'not_ready' }); }
});
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/status', statusRoutes);
app.use('/oauth', oauthRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

export default app;
