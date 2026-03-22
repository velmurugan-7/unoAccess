import mongoose, { Document, Schema } from 'mongoose';

export type AlertMetric = 'error_rate' | 'response_time_p95' | 'response_time_avg' | 'request_count';
export type AlertCondition = 'greater_than' | 'less_than';
export type AlertChannel = 'email' | 'webhook';
export type AlertStatus = 'active' | 'paused';

export interface IAlertRule extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  name: string;
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  windowMinutes: number;       // evaluation window in minutes
  channel: AlertChannel;
  webhookUrl?: string;         // if channel === 'webhook'
  status: AlertStatus;
  lastTriggeredAt?: Date;
  consecutiveBreaches: number; // internal counter
  createdAt: Date;
  updatedAt: Date;
}

export interface IAlertHistory extends Document {
  _id: mongoose.Types.ObjectId;
  ruleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  metric: AlertMetric;
  threshold: number;
  actualValue: number;
  triggeredAt: Date;
  resolvedAt?: Date;
  notificationSent: boolean;
}

const AlertRuleSchema = new Schema<IAlertRule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'OAuthClient', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    metric: { type: String, enum: ['error_rate', 'response_time_p95', 'response_time_avg', 'request_count'], required: true },
    condition: { type: String, enum: ['greater_than', 'less_than'], required: true },
    threshold: { type: Number, required: true },
    windowMinutes: { type: Number, required: true, default: 5 },
    channel: { type: String, enum: ['email', 'webhook'], required: true, default: 'email' },
    webhookUrl: { type: String },
    status: { type: String, enum: ['active', 'paused'], default: 'active' },
    lastTriggeredAt: { type: Date },
    consecutiveBreaches: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const AlertHistorySchema = new Schema<IAlertHistory>(
  {
    ruleId: { type: Schema.Types.ObjectId, ref: 'AlertRule', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'OAuthClient', required: true },
    metric: { type: String, required: true },
    threshold: { type: Number, required: true },
    actualValue: { type: Number, required: true },
    triggeredAt: { type: Date, default: Date.now, index: true },
    resolvedAt: { type: Date },
    notificationSent: { type: Boolean, default: false },
  },
  { timestamps: false }
);

// TTL: auto-delete history older than 90 days
AlertHistorySchema.index({ triggeredAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

export const AlertRule = mongoose.model<IAlertRule>('AlertRule', AlertRuleSchema);
export const AlertHistory = mongoose.model<IAlertHistory>('AlertHistory', AlertHistorySchema);
