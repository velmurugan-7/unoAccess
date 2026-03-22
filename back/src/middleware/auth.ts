// import { Request, Response, NextFunction } from 'express';
// import { verifyAccessToken } from '../utils/jwt';
// import { User } from '../models/User';
// import { AppError } from './errorHandler';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         userId: string;
//         email: string;
//         role: string;
//       };
//     }
//   }
// }

// export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     // Try cookie first, then Authorization header
//     const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
//     if (!token) throw new AppError('Authentication required', 401);

//     const payload = verifyAccessToken(token);
//     req.user = payload;
//     next();
//   } catch {
//     next(new AppError('Invalid or expired token', 401));
//   }
// };

// export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
//   if (req.user?.role !== 'admin') {
//     return next(new AppError('Admin access required', 403));
//   }
//   next();
// };

// export const requireVerified = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
//   const user = await User.findById(req.user?.userId);
//   if (!user?.isVerified) {
//     return next(new AppError('Please verify your email first', 403));
//   }
//   next();
// };

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Try cookie first, then Authorization header
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new AppError('Authentication required', 401);

    const payload = verifyAccessToken(token);
    
    // If token doesn't have sessionVersion, it's an old token – force re-login
    if (payload.sessionVersion === undefined) {
      throw new AppError('Token expired, please log in again', 401);
    }

    // Fetch user to check sessionVersion
    const user = await User.findById(payload.userId).select('sessionVersion isSuspended');
    if (!user) throw new AppError('User not found', 401);
    if (user.isSuspended) throw new AppError('Account suspended', 403);
    
    // Compare session versions
    if (user.sessionVersion !== payload.sessionVersion) {
      throw new AppError('Session revoked, please log in again', 401);
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

export const requireVerified = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const user = await User.findById(req.user?.userId);
  if (!user?.isVerified) {
    return next(new AppError('Please verify your email first', 403));
  }
  next();
};