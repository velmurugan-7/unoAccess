import { Router } from 'express';
import { getStatus, createIncident, updateIncident, listIncidents } from '../controllers/statusController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public
router.get('/', getStatus);

// Admin-only management
router.use(authenticate, requireAdmin);
router.get('/incidents', listIncidents);
router.post('/incidents', createIncident);
router.put('/incidents/:id', updateIncident);

export default router;
