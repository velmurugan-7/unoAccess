import mongoose from 'mongoose';

const userConsentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'OAuthClient', required: true },
  scope: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userConsentSchema.index({ userId: 1, clientId: 1 }, { unique: true });

export const UserConsent = mongoose.model('UserConsent', userConsentSchema);