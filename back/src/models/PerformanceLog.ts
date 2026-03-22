import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformanceLog extends Document {
  clientId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  timestamp: Date;
  endpoint: string;
  method: string;
  responseTime: number; // ms
  statusCode: number;
  userAgent: string;
  ip?: string; // hashed for privacy
}

const PerformanceLogSchema = new Schema<IPerformanceLog>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'OAuthClient', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true, uppercase: true },
    responseTime: { type: Number, required: true },
    statusCode: { type: Number, required: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: false }
);

// Compound index for efficient aggregation queries
PerformanceLogSchema.index({ clientId: 1, timestamp: -1 });
PerformanceLogSchema.index({ clientId: 1, endpoint: 1, timestamp: -1 });

// TTL: auto-delete logs older than 90 days
PerformanceLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const PerformanceLog = mongoose.model<IPerformanceLog>('PerformanceLog', PerformanceLogSchema);
