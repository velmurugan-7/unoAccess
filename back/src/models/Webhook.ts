import mongoose, { Document, Schema } from 'mongoose';

export type WebhookEvent =
  | 'user.login' | 'user.logout' | 'user.register'
  | 'token.revoked' | 'user.updated' | 'user.suspended'
  | 'oauth.consent_granted' | 'oauth.access_revoked';

export interface IWebhook extends Document {
  clientId: mongoose.Types.ObjectId;
  url: string;
  secret: string; // HMAC signing secret (encrypted)
  events: WebhookEvent[];
  isActive: boolean;
  failureCount: number;
  lastDeliveryAt?: Date;
  lastStatus?: number;
  createdAt: Date;
}

const WebhookSchema = new Schema<IWebhook>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'OAuthClient', required: true, index: true },
    url: { type: String, required: true },
    secret: { type: String, required: true },
    events: [{ type: String }],
    isActive: { type: Boolean, default: true },
    failureCount: { type: Number, default: 0 },
    lastDeliveryAt: { type: Date },
    lastStatus: { type: Number },
  },
  { timestamps: true }
);

export const Webhook = mongoose.model<IWebhook>('Webhook', WebhookSchema);
