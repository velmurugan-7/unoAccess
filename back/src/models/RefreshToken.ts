// import mongoose, { Document, Schema } from 'mongoose';

// export interface IRefreshToken extends Document {
//   token: string;
//   userId: mongoose.Types.ObjectId;
//   expiresAt: Date;
//   isRevoked: boolean;
//   createdAt: Date;
//   // --- Session metadata ---
//   deviceName: string;      // e.g. "Chrome on Windows", "Safari on iPhone"
//   browser: string;         // e.g. "Chrome 120"
//   os: string;              // e.g. "Windows 11", "iOS 17"
//   deviceType: string;      // "desktop" | "mobile" | "tablet" | "unknown"
//   ipHash: string;          // SHA-256 hashed IP (privacy-safe)
//   ipRaw: string;           // stored temporarily for geolocation then cleared
//   country: string;         // e.g. "India"
//   city: string;            // e.g. "Coimbatore"
//   flag: string;            // country flag emoji e.g. "🇮🇳"
//   lastActiveAt: Date;      // updated on every token refresh
//   userAgent: string;       // raw user-agent string
// }

// const RefreshTokenSchema = new Schema<IRefreshToken>(
//   {
//     token: { type: String, required: true, unique: true },
//     userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
//     expiresAt: { type: Date, required: true },
//     isRevoked: { type: Boolean, default: false },
//     // Session metadata
//     deviceName: { type: String, default: 'Unknown Device' },
//     browser: { type: String, default: 'Unknown Browser' },
//     os: { type: String, default: 'Unknown OS' },
//     deviceType: { type: String, default: 'unknown' },
//     ipHash: { type: String, default: '' },
//     ipRaw: { type: String, default: '', select: false }, // hidden from normal queries
//     country: { type: String, default: '' },
//     city: { type: String, default: '' },
//     flag: { type: String, default: '' },
//     lastActiveAt: { type: Date, default: Date.now },
//     userAgent: { type: String, default: '' },
//   },
//   { timestamps: true }
// );

// // Auto-delete expired tokens via TTL
// RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  token: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  // --- Session metadata ---
  deviceName: string;
  browser: string;
  os: string;
  deviceType: string;
  ipHash: string;
  ipRaw: string;
  country: string;
  city: string;
  flag: string;
  lat: number;   // ← new
  lng: number;   // ← new
  lastActiveAt: Date;
  userAgent: string;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
    deviceName: { type: String, default: 'Unknown Device' },
    browser: { type: String, default: 'Unknown Browser' },
    os: { type: String, default: 'Unknown OS' },
    deviceType: { type: String, default: 'unknown' },
    ipHash: { type: String, default: '' },
    ipRaw: { type: String, default: '', select: false },
    country: { type: String, default: '' },
    city: { type: String, default: '' },
    flag: { type: String, default: '' },
    lat: { type: Number, default: 0 },   // ← new
    lng: { type: Number, default: 0 },   // ← new
    lastActiveAt: { type: Date, default: Date.now },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);