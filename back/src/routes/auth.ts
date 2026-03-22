import { Router } from 'express';
import * as auth from '../controllers/authController';
import { validate, schemas } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', authLimiter, validate(schemas.register), auth.register);
router.get('/verify-email/:token', auth.verifyEmail);
router.post('/login', authLimiter, validate(schemas.login), auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.post('/forgot-password', authLimiter, validate(schemas.forgotPassword), auth.forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(schemas.resetPassword), auth.resetPassword);
router.post('/resend-verification', authLimiter, auth.resendVerification);

// 2FA routes (require authentication)
router.post('/2fa/setup', authenticate, auth.setup2FA);
router.post('/2fa/verify', authenticate, auth.verify2FA);
router.delete('/2fa', authenticate, auth.disable2FA);

export default router;
