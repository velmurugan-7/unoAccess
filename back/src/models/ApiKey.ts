import mongoose, { Document, Schema } from 'mongoose';

export interface IApiKey extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  keyHash: string;       // SHA-256 hash of the actual key
  keyPrefix: string;     // first 8 chars shown in UI (e.g. "ua_live_")
  scopes: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    keyHash: { type: String, required: true, unique: true, select: false },
    keyPrefix: { type: String, required: true },
    scopes: [{ type: String }],
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ApiKeySchema.index({ userId: 1, isActive: 1 });

export const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
