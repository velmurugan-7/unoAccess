// import mongoose, { Document, Schema } from 'mongoose';
// import bcrypt from 'bcryptjs';

// export interface IUser extends Document {
//   _id: mongoose.Types.ObjectId;
//   name: string;
//   email: string;
//   password: string;
//   role: 'user' | 'admin';
//   isVerified: boolean;
//   isSuspended: boolean;
//   avatarUrl?: string;
//   verificationToken?: string;
//   verificationTokenExpiry?: Date;
//   passwordResetToken?: string;
//   passwordResetExpiry?: Date;
//   twoFactorEnabled: boolean;
//   twoFactorSecret?: string;
//   twoFactorBackupCodes?: string[];
//   loginAttempts: number;
//   lockUntil?: Date;
//   emailPreferences: {
//     securityAlerts: boolean;
//     loginNotifications: boolean;
//     productUpdates: boolean;
//     weeklyDigest: boolean;
//   };
//   knownIpHashes: string[];
//   createdAt: Date;
//   updatedAt: Date;
//   comparePassword(candidatePassword: string): Promise<boolean>;
//   isLocked(): boolean;
//   incrementLoginAttempts(): Promise<void>;
//   resetLoginAttempts(): Promise<void>;
// }

// const UserSchema = new Schema<IUser>(
//   {
//     name: { type: String, required: true, trim: true, maxlength: 100 },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     password: { type: String, required: true, minlength: 8 },
//     role: { type: String, enum: ['user', 'admin'], default: 'user' },
//     isVerified: { type: Boolean, default: false },
//     isSuspended: { type: Boolean, default: false },
//     avatarUrl: { type: String },
//     verificationToken: { type: String, select: false },
//     verificationTokenExpiry: { type: Date, select: false },
//     passwordResetToken: { type: String, select: false },
//     passwordResetExpiry: { type: Date, select: false },
//     twoFactorEnabled: { type: Boolean, default: false },
//     twoFactorSecret: { type: String, select: false },
//     twoFactorBackupCodes: { type: [String], select: false },
//     loginAttempts: { type: Number, default: 0 },
//     lockUntil: { type: Date },
//     emailPreferences: {
//       securityAlerts: { type: Boolean, default: true },
//       loginNotifications: { type: Boolean, default: true },
//       productUpdates: { type: Boolean, default: true },
//       weeklyDigest: { type: Boolean, default: false },
//     },
//     knownIpHashes: { type: [String], default: [] },
//   },
//   { timestamps: true }
// );

// UserSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// UserSchema.methods.isLocked = function (): boolean {
//   return !!(this.lockUntil && this.lockUntil > new Date());
// };

// UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
//   const MAX_ATTEMPTS = 5;
//   const LOCK_TIME = 30 * 60 * 1000; // 30 minutes
//   if (this.lockUntil && this.lockUntil < new Date()) {
//     // Reset if lock expired
//     this.loginAttempts = 1;
//     this.lockUntil = undefined;
//   } else {
//     this.loginAttempts += 1;
//     if (this.loginAttempts >= MAX_ATTEMPTS) {
//       this.lockUntil = new Date(Date.now() + LOCK_TIME);
//     }
//   }
//   await this.save();
// };

// UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
//   this.loginAttempts = 0;
//   this.lockUntil = undefined;
//   await this.save();
// };

// UserSchema.set('toJSON', {
//   transform: (_doc, ret) => {
//     const { password, __v, twoFactorSecret, twoFactorBackupCodes, ...rest } = ret;
//     return rest;
//   },
// });

// export const User = mongoose.model<IUser>('User', UserSchema);

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  isSuspended: boolean;
  avatarUrl?: string;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  loginAttempts: number;
  lockUntil?: Date;
  emailPreferences: {
    securityAlerts: boolean;
    loginNotifications: boolean;
    productUpdates: boolean;
    weeklyDigest: boolean;
  };
  knownIpHashes: string[];
  sessionVersion: number; // 👈 NEW FIELD
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    avatarUrl: { type: String },
    avatar: { type: String }, 
    verificationToken: { type: String, select: false },
    verificationTokenExpiry: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorBackupCodes: { type: [String], select: false },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    emailPreferences: {
      securityAlerts: { type: Boolean, default: true },
      loginNotifications: { type: Boolean, default: true },
      productUpdates: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
    },
    knownIpHashes: { type: [String], default: [] },
    sessionVersion: { type: Number, default: 0 }, // 👈 NEW FIELD
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 30 * 60 * 1000; // 30 minutes
  if (this.lockUntil && this.lockUntil < new Date()) {
    // Reset if lock expired
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= MAX_ATTEMPTS) {
      this.lockUntil = new Date(Date.now() + LOCK_TIME);
    }
  }
  await this.save();
};

UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const { password, __v, twoFactorSecret, twoFactorBackupCodes, ...rest } = ret;
    return rest;
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);