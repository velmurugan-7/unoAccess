import { Request, Response, NextFunction } from 'express';

export const forceCookie = (req: Request, res: Response, next: NextFunction) => {
  // Force browser to accept and send cookies
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // If this is a redirect, ensure cookies are included
  if (req.path.includes('/oauth/authorize')) {
    console.log('🔄 OAuth authorize request - ensuring cookies are sent');
  }
  
  next();
};