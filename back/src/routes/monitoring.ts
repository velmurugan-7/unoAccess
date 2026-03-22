// import { Router } from 'express';
// import { ingestLogs, getStats } from '../controllers/monitoringController';
// import { ingestCustomEvents, ingestErrors, getCustomEvents, getCapturedErrors, resolveError, getServiceMap } from '../controllers/sdkEventsController';
// import { authenticate } from '../middleware/auth';

// const router = Router();

// // SDK ingestion (Basic auth)
// router.post('/logs', ingestLogs);
// router.post('/events', ingestCustomEvents);
// router.post('/errors', ingestErrors);

// // Authenticated user stats
// router.get('/:clientId/stats', authenticate, getStats);
// router.get('/:clientId/custom-events', authenticate, getCustomEvents);
// router.get('/:clientId/errors', authenticate, getCapturedErrors);
// router.patch('/:clientId/errors/:id/resolve', authenticate, resolveError);
// router.get('/:clientId/service-map', authenticate, getServiceMap);

// export default router;

import { Router } from 'express';
import { ingestLogs, getStats } from '../controllers/monitoringController';
import { ingestCustomEvents, ingestErrors, getCustomEvents, getCapturedErrors, resolveError, getServiceMap } from '../controllers/sdkEventsController';
import { ingestRum, getRumStats, getRumSnippet } from '../controllers/rumController';
import { authenticate } from '../middleware/auth';

const router = Router();

// SDK ingestion (Basic auth — clientId + clientSecret)
router.post('/logs', ingestLogs);
router.post('/events', ingestCustomEvents);
router.post('/errors', ingestErrors);

// RUM ingestion — browser-safe, clientId only, no secret needed
router.post('/rum', ingestRum);

// Authenticated user routes
router.get('/:clientId/stats',        authenticate, getStats);
router.get('/:clientId/rum',          authenticate, getRumStats);
router.get('/:clientId/rum-snippet',  authenticate, getRumSnippet);
router.get('/:clientId/custom-events', authenticate, getCustomEvents);
router.get('/:clientId/errors',       authenticate, getCapturedErrors);
router.patch('/:clientId/errors/:id/resolve', authenticate, resolveError);
router.get('/:clientId/service-map',  authenticate, getServiceMap);

export default router;