import { Router } from 'express';
import * as admin from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();
router.use(authenticate, requireAdmin);

// Clients
router.get('/clients', admin.listClients);
router.post('/clients', validate(schemas.createClient), admin.createClient);
router.put('/clients/:id', admin.updateClient);
router.delete('/clients/:id', admin.deleteClient);
router.post('/clients/:id/rotate-secret', admin.rotateClientSecret);

// Webhooks
router.get('/clients/:clientId/webhooks', admin.listWebhooks);
router.post('/clients/:clientId/webhooks', admin.createWebhook);
router.delete('/clients/:clientId/webhooks/:webhookId', admin.deleteWebhook);

// User management
router.get('/users', admin.listUsers);
router.get('/users/:id', admin.getUser);
router.post('/users/:id/suspend', admin.suspendUser);
router.post('/users/:id/unsuspend', admin.unsuspendUser);
router.post('/users/:id/verify', admin.manualVerifyUser);

// Announcements
router.get('/announcements', admin.listAnnouncements);
router.post('/announcements', admin.createAnnouncement);
router.put('/announcements/:id', admin.updateAnnouncement);
router.delete('/announcements/:id', admin.deleteAnnouncement);

// Analytics & Audit
router.get('/dashboard', admin.getDashboardStats);
router.get('/audit-log', admin.getAdminAuditLog);

export default router;
