// import mongoose, { Document, Schema } from 'mongoose';

// export type AuditAction =
//   | 'user.login' | 'user.logout' | 'user.register' | 'user.verify_email'
//   | 'user.password_reset' | 'user.password_change' | 'user.profile_update'
//   | 'user.2fa_enable' | 'user.2fa_disable' | 'user.session_revoke'
//   | 'user.suspicious_login' | 'user.account_locked' | 'user.suspended'
//   | 'oauth.authorize' | 'oauth.token_issued' | 'oauth.consent_granted' | 'oauth.access_revoked'
//   | 'admin.client_create' | 'admin.client_update' | 'admin.client_delete' | 'admin.secret_rotate'
//   | 'admin.user_suspend' | 'admin.user_unsuspend' | 'admin.user_verify'
//   | 'webhook.delivered' | 'webhook.failed'
//   | 'api_key.created' | 'api_key.revoked';

// export interface IAuditLog extends Document {
//   userId?: mongoose.Types.ObjectId;
//   actorId?: mongoose.Types.ObjectId; // admin performing action on userId
//   action: AuditAction;
//   resource?: string;
//   resourceId?: string;
//   metadata?: Record<string, unknown>;
//   ip?: string;
//   userAgent?: string;
//   success: boolean;
//   timestamp: Date;
// }

// const AuditLogSchema = new Schema<IAuditLog>(
//   {
//     userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
//     actorId: { type: Schema.Types.ObjectId, ref: 'User' },
//     action: { type: String, required: true, index: true },
//     resource: { type: String },
//     resourceId: { type: String },
//     metadata: { type: Schema.Types.Mixed },
//     ip: { type: String },
//     userAgent: { type: String },
//     success: { type: Boolean, default: true },
//     timestamp: { type: Date, default: Date.now, index: true },
//   },
//   { timestamps: false }
// );

// AuditLogSchema.index({ userId: 1, timestamp: -1 });
// AuditLogSchema.index({ action: 1, timestamp: -1 });
// // Auto-delete audit logs older than 1 year
// AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });

// export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction =
  | 'user.login' | 'user.logout' | 'user.register' | 'user.verify_email'
  | 'user.password_reset' | 'user.password_change' | 'user.profile_update'
  | 'user.2fa_enable' | 'user.2fa_disable' | 'user.session_revoke'
  | 'user.revoke_all_sessions'  // 👈 added
  | 'user.suspicious_login' | 'user.account_locked' | 'user.suspended'
  | 'oauth.authorize' | 'oauth.token_issued' | 'oauth.consent_granted' | 'oauth.access_revoked'
  | 'admin.client_create' | 'admin.client_update' | 'admin.client_delete' | 'admin.secret_rotate'
  | 'admin.user_suspend' | 'admin.user_unsuspend' | 'admin.user_verify'
  | 'webhook.delivered' | 'webhook.failed'
  | 'api_key.created' | 'api_key.revoked';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId; // admin performing action on userId
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  success: boolean;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, index: true },
    resource: { type: String },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    success: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
// Auto-delete audit logs older than 1 year
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);