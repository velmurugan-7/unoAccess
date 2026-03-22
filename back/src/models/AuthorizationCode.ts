import mongoose, { Document, Schema } from 'mongoose';

export interface IAuthorizationCode extends Document {
  code: string;
  clientId: string;
  userId: mongoose.Types.ObjectId;
  redirectUri: string;
  scope: string[];
  state?: string;
  expiresAt: Date;
  isUsed: boolean;
}

const AuthorizationCodeSchema = new Schema<IAuthorizationCode>({
  code: { type: String, required: true, unique: true },
  clientId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  redirectUri: { type: String, required: true },
  scope: [{ type: String }],
  state: { type: String },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
});

// Auto-delete expired codes
AuthorizationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthorizationCode = mongoose.model<IAuthorizationCode>('AuthorizationCode', AuthorizationCodeSchema);
