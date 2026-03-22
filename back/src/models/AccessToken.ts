import mongoose, { Document, Schema } from 'mongoose';

export interface IAccessToken extends Document {
  token: string;
  clientId: string;
  userId: mongoose.Types.ObjectId;
  scope: string[];
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

const AccessTokenSchema = new Schema<IAccessToken>(
  {
    token: { type: String, required: true, unique: true },
    clientId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scope: [{ type: String }],
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-delete expired tokens
AccessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AccessToken = mongoose.model<IAccessToken>('AccessToken', AccessTokenSchema);
