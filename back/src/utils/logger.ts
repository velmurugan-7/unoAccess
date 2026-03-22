import winston from 'winston';
import { config } from '../config/env';

export const logger = winston.createLogger({
  level: config.isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    config.isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...rest }) => {
            const extra = Object.keys(rest).length ? JSON.stringify(rest) : '';
            return `${timestamp} [${level}]: ${message} ${extra}`;
          })
        )
  ),
  transports: [new winston.transports.Console()],
});
