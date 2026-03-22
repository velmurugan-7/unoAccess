// import mongoose, { Document, Schema } from 'mongoose';

// export interface IOAuthClient extends Document {
//   _id: mongoose.Types.ObjectId;
//   name: string;
//   clientId: string;
//   clientSecret: string; // AES-256 encrypted
//   redirectUris: string[];
//   scopes: string[];
//   logoUrl?: string;
//   website?: string;
//   isActive: boolean;
//   createdBy: mongoose.Types.ObjectId;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const OAuthClientSchema = new Schema<IOAuthClient>(
//   {
//     name: { type: String, required: true, trim: true },
//     clientId: { type: String, required: true, unique: true },
//     clientSecret: { type: String, required: true }, // stored encrypted
//     redirectUris: [{ type: String, required: true }],
//     scopes: [{ type: String, default: ['openid', 'profile', 'email'] }],
//     logoUrl: { type: String },
//     website: { type: String },
//     isActive: { type: Boolean, default: true },
//     createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//   },
//   { timestamps: true }
// );

// export const OAuthClient = mongoose.model<IOAuthClient>('OAuthClient', OAuthClientSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IOAuthClient extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  clientId: string;
  clientSecret: string; // AES-256 encrypted
  redirectUris: string[];
  scopes: string[];
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  // true only when a regular user registers their own app via /api/user/apps
  // false (default) for all apps created by admin via the admin panel
  selfRegistered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OAuthClientSchema = new Schema<IOAuthClient>(
  {
    name: { type: String, required: true, trim: true },
    clientId: { type: String, required: true, unique: true },
    clientSecret: { type: String, required: true }, // stored encrypted
    redirectUris: [{ type: String, required: true }],
    scopes: [{ type: String, default: ['openid', 'profile', 'email'] }],
    logoUrl: { type: String },
    website: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    selfRegistered: { type: Boolean, default: false }, // ← new field
  },
  { timestamps: true }
);

export const OAuthClient = mongoose.model<IOAuthClient>('OAuthClient', OAuthClientSchema);