import mongoose, { Document, Schema } from 'mongoose';

// ── Custom Events (monitor.trace) ─────────────────────────────────────────────
export interface ICustomEvent extends Document {
  clientId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  name: string;
  properties: Record<string, unknown>;
  value?: number;           // numeric metric value
  service?: string;         // service tag for service maps
  timestamp: Date;
}

const CustomEventSchema = new Schema<ICustomEvent>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'OAuthClient', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, maxlength: 200, index: true },
    properties: { type: Schema.Types.Mixed, default: {} },
    value: { type: Number },
    service: { type: String, maxlength: 100, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

CustomEventSchema.index({ clientId: 1, timestamp: -1 });
CustomEventSchema.index({ clientId: 1, name: 1, timestamp: -1 });
// TTL 90 days
CustomEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

// ── Captured Errors (monitor.captureError) ────────────────────────────────────
export interface ICapturedError extends Document {
  clientId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  fingerprint: string;      // SHA-256 hash of normalized message for grouping
  message: string;
  stack?: string;
  metadata: Record<string, unknown>;
  service?: string;
  count: number;            // total occurrences (incremented on upsert)
  firstSeenAt: Date;
  lastSeenAt: Date;
  affectedUsers: string[];  // array of userId strings (up to 100)
  isResolved: boolean;
}

const CapturedErrorSchema = new Schema<ICapturedError>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'OAuthClient', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    fingerprint: { type: String, required: true, index: true },
    message: { type: String, required: true, maxlength: 1000 },
    stack: { type: String, maxlength: 10000 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    service: { type: String, maxlength: 100 },
    count: { type: Number, default: 1 },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    affectedUsers: [{ type: String }],
    isResolved: { type: Boolean, default: false },
  },
  { timestamps: false }
);

CapturedErrorSchema.index({ clientId: 1, fingerprint: 1 }, { unique: true });
CapturedErrorSchema.index({ clientId: 1, lastSeenAt: -1 });

export const CustomEvent = mongoose.model<ICustomEvent>('CustomEvent', CustomEventSchema);
export const CapturedError = mongoose.model<ICapturedError>('CapturedError', CapturedErrorSchema);
