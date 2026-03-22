import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri, {
      autoIndex: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45_000,
      serverSelectionTimeoutMS: 10_000,
    });
    logger.info('MongoDB connected');
    mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
