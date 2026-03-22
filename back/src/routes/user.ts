import { Router } from 'express';
import multer from 'multer';
import * as userApp from '../controllers/userAppController';
import * as user from '../controllers/userController';
import * as apiKey from '../controllers/apiKeyController';
import * as alert from '../controllers/alertController';
import * as slo from '../controllers/sloController';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
const router = Router();

// Non-auth routes
router.post('/recent-account', user.updateRecentAccount);
router.get('/announcements', user.getAnnouncements);

router.use(authenticate);

// Profile & Account
router.get('/profile', user.getProfile);
router.put('/profile', validate(schemas.updateProfile), user.updateProfile);
router.post('/avatar', upload.single('avatar'), user.uploadAvatar);
router.put('/change-password', validate(schemas.changePassword), user.changePassword);
router.get('/connected-apps', user.getConnectedApps);
router.delete('/connected-apps/:clientId', user.revokeAppAccess);
router.get('/sessions', user.getSessions);
router.delete('/sessions', user.revokeAllOtherSessions);
router.delete('/sessions/:sessionId', user.revokeSession);
router.get('/email-preferences', user.getEmailPreferences);
router.put('/email-preferences', user.updateEmailPreferences);
router.get('/audit-log', user.getAuditLog);
router.get('/audit-log/export', user.exportAuditLog);

// API Keys
router.get('/api-keys', apiKey.listApiKeys);
router.post('/api-keys', apiKey.createApiKey);
router.delete('/api-keys/:id', apiKey.revokeApiKey);

// Alert Rules
router.get('/alerts/history', alert.getAlertHistory);
router.get('/alerts', alert.listAlertRules);
router.post('/alerts', alert.createAlertRule);
router.put('/alerts/:id', alert.updateAlertRule);
router.delete('/alerts/:id', alert.deleteAlertRule);

// SLO
router.get('/slo/:clientId/report', slo.getSloReport);
router.get('/slo/:clientId', slo.listSlos);
router.post('/slo', slo.createSlo);
router.delete('/slo/:id', slo.deleteSlo);

// ── Self-Service App Registration (1 app per user) ─────────────────────────
router.get('/apps', userApp.getUserApp);
router.post('/apps', userApp.createUserApp);
router.put('/apps', userApp.updateUserApp);
router.delete('/apps', userApp.deleteUserApp);
router.post('/apps/rotate-secret', userApp.rotateUserAppSecret);

export default router;
