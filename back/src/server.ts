import { config } from './config/env';
import { connectDB } from './config/database';
import { logger } from './utils/logger';
import app from './app';
import { startAlertWorker } from './services/alertWorker';

let server: ReturnType<typeof app.listen>;
let alertWorkerTimer: NodeJS.Timeout | undefined;

const start = async () => {
  await connectDB();
  server = app.listen(config.port, () => {
    logger.info(`UnoAccess server running on port ${config.port} in ${config.nodeEnv} mode`);
  });
  // Start background alert worker
  alertWorkerTimer = startAlertWorker();
};

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  if (alertWorkerTimer) clearInterval(alertWorkerTimer);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      const mongoose = await import('mongoose');
      await mongoose.default.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
    setTimeout(() => { logger.error('Forced shutdown'); process.exit(1); }, 30_000).unref();
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  shutdown('unhandledRejection');
});

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
