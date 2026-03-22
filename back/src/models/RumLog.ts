import mongoose, { Document, Schema } from 'mongoose';

export type RumRating = 'good' | 'needs-improvement' | 'poor';

export interface IRumLog extends Document {
  clientId: mongoose.Types.ObjectId;
  sessionId: string;
  url: string;
  deviceType: string;
  connectionType: string;
  lcp?: number;
  lcpRating?: RumRating;
  cls?: number;
  clsRating?: RumRating;
  inp?: number;
  inpRating?: RumRating;
  fcp?: number;
  fcpRating?: RumRating;
  ttfb?: number;
  ttfbRating?: RumRating;
  timestamp: Date;
}

export function lcpRating(v: number): RumRating  { return v <= 2500 ? 'good' : v <= 4000 ? 'needs-improvement' : 'poor'; }
export function clsRating(v: number): RumRating  { return v <= 0.1  ? 'good' : v <= 0.25 ? 'needs-improvement' : 'poor'; }
export function inpRating(v: number): RumRating  { return v <= 200  ? 'good' : v <= 500  ? 'needs-improvement' : 'poor'; }
export function fcpRating(v: number): RumRating  { return v <= 1800 ? 'good' : v <= 3000 ? 'needs-improvement' : 'poor'; }
export function ttfbRating(v: number): RumRating { return v <= 800  ? 'good' : v <= 1800 ? 'needs-improvement' : 'poor'; }

const RumLogSchema = new Schema<IRumLog>(
  {
    clientId:       { type: Schema.Types.ObjectId, ref: 'OAuthClient', required: true, index: true },
    sessionId:      { type: String, required: true },
    url:            { type: String, required: true, maxlength: 500 },
    deviceType:     { type: String, default: 'unknown' },
    connectionType: { type: String, default: 'unknown' },
    lcp:  { type: Number }, lcpRating:  { type: String },
    cls:  { type: Number }, clsRating:  { type: String },
    inp:  { type: Number }, inpRating:  { type: String },
    fcp:  { type: Number }, fcpRating:  { type: String },
    ttfb: { type: Number }, ttfbRating: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

RumLogSchema.index({ clientId: 1, timestamp: -1 });
RumLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

export const RumLog = mongoose.model<IRumLog>('RumLog', RumLogSchema);