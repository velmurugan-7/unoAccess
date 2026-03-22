import mongoose, { Document, Schema } from 'mongoose';

export interface ISlo extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  metricType: 'p95_latency' | 'p99_latency' | 'avg_latency' | 'error_rate' | 'availability';
  targetValue: number;    // e.g. 500 (ms) or 1 (%)
  windowDays: number;     // evaluation window in days
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SloSchema = new Schema<ISlo>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'OAuthClient', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    metricType: {
      type: String,
      enum: ['p95_latency', 'p99_latency', 'avg_latency', 'error_rate', 'availability'],
      required: true,
    },
    targetValue: { type: Number, required: true },
    windowDays: { type: Number, required: true, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Slo = mongoose.model<ISlo>('Slo', SloSchema);
