// import { Request, Response } from 'express';
// import crypto from 'crypto';
// import { OAuthClient } from '../models/OAuthClient';
// import { PerformanceLog } from '../models/PerformanceLog';
// import { decrypt } from '../utils/encryption';
// import { AppError } from '../middleware/errorHandler';

// // -----------------------------------------------------------------------
// // POST /api/monitoring/logs
// // Accepts batch performance logs from SDK clients.
// // Auth: HTTP Basic (clientId:clientSecret) or ?client_id=&client_secret= in body
// // -----------------------------------------------------------------------
// export const ingestLogs = async (req: Request, res: Response): Promise<void> => {
//   // --- Authenticate client ---
//   let clientId: string | undefined;
//   let clientSecret: string | undefined;

//   // Support Authorization: Basic base64(clientId:clientSecret)
//   const authHeader = req.headers.authorization;
//   if (authHeader?.startsWith('Basic ')) {
//     const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
//     const colon = decoded.indexOf(':');
//     clientId = decoded.slice(0, colon);
//     clientSecret = decoded.slice(colon + 1);
//   } else {
//     // Fall back to body params
//     clientId = req.body.client_id;
//     clientSecret = req.body.client_secret;
//   }

//   if (!clientId || !clientSecret) throw new AppError('Client credentials required', 401);

//   const client = await OAuthClient.findOne({ clientId, isActive: true });
//   if (!client) throw new AppError('Unknown client', 401);

//   const decryptedSecret = decrypt(client.clientSecret);
//   if (decryptedSecret !== clientSecret) throw new AppError('Invalid client credentials', 401);

//   // --- Validate logs payload ---
//   const { logs } = req.body as { logs?: unknown[] };
//   if (!Array.isArray(logs) || logs.length === 0) throw new AppError('logs array is required', 400);
//   if (logs.length > 1000) throw new AppError('Maximum 1000 logs per batch', 400);

//   // Hash IPs for privacy
//   const hashIp = (ip: string) =>
//     crypto.createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'salt')).digest('hex').slice(0, 16);

//   const docs = (logs as Record<string, unknown>[]).map((log) => ({
//     clientId: client._id,
//     userId: log.userId || undefined,
//     timestamp: log.timestamp ? new Date(log.timestamp as string) : new Date(),
//     endpoint: String(log.endpoint || '/').slice(0, 500),
//     method: String(log.method || 'GET').toUpperCase().slice(0, 10),
//     responseTime: Number(log.responseTime) || 0,
//     statusCode: Number(log.statusCode) || 200,
//     userAgent: String(log.userAgent || '').slice(0, 300),
//     ip: log.ip ? hashIp(String(log.ip)) : '',
//   }));

//   await PerformanceLog.insertMany(docs, { ordered: false });
//   res.json({ success: true, ingested: docs.length });
// };

// // -----------------------------------------------------------------------
// // GET /api/monitoring/:clientId/stats
// // Returns aggregated statistics. Authenticated user route.
// // -----------------------------------------------------------------------
// export const getStats = async (req: Request, res: Response): Promise<void> => {
//   const { clientId } = req.params;
//   const { range = '24h' } = req.query as Record<string, string>;

//   const client = await OAuthClient.findOne({ clientId });
//   if (!client) throw new AppError('Client not found', 404);

//   // Time range
//   const rangeMs: Record<string, number> = {
//     '1h': 60 * 60 * 1000,
//     '24h': 24 * 60 * 60 * 1000,
//     '7d': 7 * 24 * 60 * 60 * 1000,
//   };
//   const ms = rangeMs[range] ?? rangeMs['24h'];
//   const since = new Date(Date.now() - ms);

//   const matchStage = { $match: { clientId: client._id, timestamp: { $gte: since } } };

//   // 1. Time-series buckets (for charts)
//   const bucketCount = range === '1h' ? 12 : range === '7d' ? 28 : 24;
//   const bucketMs = ms / bucketCount;

//   const timeSeries = await PerformanceLog.aggregate([
//     matchStage,
//     {
//       $group: {
//         _id: {
//           $toLong: {
//             $subtract: [
//               '$timestamp',
//               { $mod: [{ $toLong: '$timestamp' }, bucketMs] },
//             ],
//           },
//         },
//         avgResponseTime: { $avg: '$responseTime' },
//         count: { $sum: 1 },
//         errors: {
//           $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] },
//         },
//       },
//     },
//     { $sort: { _id: 1 } },
//     {
//       $project: {
//         timestamp: { $toDate: '$_id' },
//         avgResponseTime: { $round: ['$avgResponseTime', 2] },
//         count: 1,
//         errorRate: {
//           $cond: [
//             { $eq: ['$count', 0] },
//             0,
//             { $round: [{ $multiply: [{ $divide: ['$errors', '$count'] }, 100] }, 2] },
//           ],
//         },
//       },
//     },
//   ]);

//   // 2. Endpoint breakdown
//   const endpoints = await PerformanceLog.aggregate([
//     matchStage,
//     {
//       $group: {
//         _id: { endpoint: '$endpoint', method: '$method' },
//         count: { $sum: 1 },
//         avgResponseTime: { $avg: '$responseTime' },
//         maxResponseTime: { $max: '$responseTime' },
//         responseTimes: { $push: '$responseTime' },
//         errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
//       },
//     },
//     { $sort: { count: -1 } },
//     { $limit: 20 },
//     {
//       $project: {
//         endpoint: '$_id.endpoint',
//         method: '$_id.method',
//         count: 1,
//         avgResponseTime: { $round: ['$avgResponseTime', 2] },
//         maxResponseTime: 1,
//         errorCount: '$errors',
//         // p95 approximation
//         p95: {
//           $arrayElemAt: [
//             { $sortArray: { input: '$responseTimes', sortBy: 1 } },
//             { $floor: { $multiply: [0.95, { $size: '$responseTimes' }] } },
//           ],
//         },
//         p50: {
//           $arrayElemAt: [
//             { $sortArray: { input: '$responseTimes', sortBy: 1 } },
//             { $floor: { $multiply: [0.50, { $size: '$responseTimes' }] } },
//           ],
//         },
//       },
//     },
//   ]);

//   // 3. Overall summary
//   const [summary] = await PerformanceLog.aggregate([
//     matchStage,
//     {
//       $group: {
//         _id: null,
//         totalRequests: { $sum: 1 },
//         avgResponseTime: { $avg: '$responseTime' },
//         maxResponseTime: { $max: '$responseTime' },
//         errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
//       },
//     },
//     {
//       $project: {
//         totalRequests: 1,
//         avgResponseTime: { $round: ['$avgResponseTime', 2] },
//         maxResponseTime: 1,
//         errorRate: {
//           $cond: [
//             { $eq: ['$totalRequests', 0] },
//             0,
//             {
//               $round: [
//                 { $multiply: [{ $divide: ['$errors', '$totalRequests'] }, 100] },
//                 2,
//               ],
//             },
//           ],
//         },
//       },
//     },
//   ]);

//   // 4. (Admin) User breakdown
//   let userBreakdown: unknown[] = [];
//   if (req.user?.role === 'admin') {
//     userBreakdown = await PerformanceLog.aggregate([
//       matchStage,
//       { $match: { userId: { $exists: true, $ne: null } } },
//       {
//         $group: {
//           _id: '$userId',
//           count: { $sum: 1 },
//           avgResponseTime: { $avg: '$responseTime' },
//         },
//       },
//       { $sort: { count: -1 } },
//       { $limit: 10 },
//       {
//         $lookup: {
//           from: 'users',
//           localField: '_id',
//           foreignField: '_id',
//           as: 'user',
//         },
//       },
//       {
//         $project: {
//           userId: '$_id',
//           email: { $arrayElemAt: ['$user.email', 0] },
//           name: { $arrayElemAt: ['$user.name', 0] },
//           count: 1,
//           avgResponseTime: { $round: ['$avgResponseTime', 2] },
//         },
//       },
//     ]);
//   }

//   res.json({
//     success: true,
//     client: { clientId: client.clientId, name: client.name, logoUrl: client.logoUrl },
//     range,
//     summary: summary || { totalRequests: 0, avgResponseTime: 0, maxResponseTime: 0, errorRate: 0 },
//     timeSeries,
//     endpoints,
//     userBreakdown,
//   });
// };
import { Request, Response } from 'express';
import crypto from 'crypto';
import { OAuthClient } from '../models/OAuthClient';
import { PerformanceLog } from '../models/PerformanceLog';
import { decrypt } from '../utils/encryption';
import { AppError } from '../middleware/errorHandler';

// -----------------------------------------------------------------------
// POST /api/monitoring/logs
// Accepts batch performance logs from SDK clients.
// Auth: HTTP Basic (clientId:clientSecret) or ?client_id=&client_secret= in body
// -----------------------------------------------------------------------
export const ingestLogs = async (req: Request, res: Response): Promise<void> => {
  // --- Authenticate client ---
  let clientId: string | undefined;
  let clientSecret: string | undefined;

  // Support Authorization: Basic base64(clientId:clientSecret)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
    const colon = decoded.indexOf(':');
    clientId = decoded.slice(0, colon);
    clientSecret = decoded.slice(colon + 1);
  } else {
    // Fall back to body params
    clientId = req.body.client_id;
    clientSecret = req.body.client_secret;
  }

  if (!clientId || !clientSecret) throw new AppError('Client credentials required', 401);

  const client = await OAuthClient.findOne({ clientId, isActive: true });
  if (!client) throw new AppError('Unknown client', 401);

  const decryptedSecret = decrypt(client.clientSecret);
  if (decryptedSecret !== clientSecret) throw new AppError('Invalid client credentials', 401);

  // --- Validate logs payload ---
  const { logs } = req.body as { logs?: unknown[] };
  if (!Array.isArray(logs) || logs.length === 0) throw new AppError('logs array is required', 400);
  if (logs.length > 1000) throw new AppError('Maximum 1000 logs per batch', 400);

  // Hash IPs for privacy
  const hashIp = (ip: string) =>
    crypto.createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'salt')).digest('hex').slice(0, 16);

  const docs = (logs as Record<string, unknown>[]).map((log) => ({
    clientId: client._id,
    userId: log.userId || undefined,
    timestamp: log.timestamp ? new Date(log.timestamp as string) : new Date(),
    endpoint: String(log.endpoint || '/').slice(0, 500),
    method: String(log.method || 'GET').toUpperCase().slice(0, 10),
    responseTime: Number(log.responseTime) || 0,
    statusCode: Number(log.statusCode) || 200,
    userAgent: String(log.userAgent || '').slice(0, 300),
    ip: log.ip ? hashIp(String(log.ip)) : '',
  }));

  await PerformanceLog.insertMany(docs, { ordered: false });
  res.json({ success: true, ingested: docs.length });
};

// -----------------------------------------------------------------------
// GET /api/monitoring/:clientId/stats
// Returns aggregated statistics. Authenticated user route.
// -----------------------------------------------------------------------
export const getStats = async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const { range = '24h' } = req.query as Record<string, string>;

  const client = await OAuthClient.findOne({ clientId });
  if (!client) throw new AppError('Client not found', 404);

  // Time range
  const rangeMs: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };
  const ms = rangeMs[range] ?? rangeMs['24h'];
  const since = new Date(Date.now() - ms);

  const matchStage = { $match: { clientId: client._id, timestamp: { $gte: since } } };

  // 1. Time-series buckets (for charts)
  const bucketCount = range === '1h' ? 12 : range === '7d' ? 28 : 24;
  const bucketMs = ms / bucketCount;

  const timeSeries = await PerformanceLog.aggregate([
    matchStage,
    {
      $group: {
        _id: {
          $toLong: {
            $subtract: [
              '$timestamp',
              { $mod: [{ $toLong: '$timestamp' }, bucketMs] },
            ],
          },
        },
        avgResponseTime: { $avg: '$responseTime' },
        count: { $sum: 1 },
        errors: {
          $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        timestamp: { $toDate: '$_id' },
        avgResponseTime: { $round: ['$avgResponseTime', 2] },
        count: 1,
        errorRate: {
          $cond: [
            { $eq: ['$count', 0] },
            0,
            { $round: [{ $multiply: [{ $divide: ['$errors', '$count'] }, 100] }, 2] },
          ],
        },
      },
    },
  ]);

  // 2. Endpoint breakdown with percentiles
  const endpoints = await PerformanceLog.aggregate([
    matchStage,
    {
      $group: {
        _id: { endpoint: '$endpoint', method: '$method' },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' },
        responseTimes: { $push: '$responseTime' },
        errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
    {
      $project: {
        endpoint: '$_id.endpoint',
        method: '$_id.method',
        count: 1,
        avgResponseTime: { $round: ['$avgResponseTime', 2] },
        maxResponseTime: 1,
        errorCount: '$errors',
        // p50 (median)
        p50: {
          $arrayElemAt: [
            { $sortArray: { input: '$responseTimes', sortBy: 1 } },
            { $floor: { $multiply: [0.50, { $size: '$responseTimes' }] } },
          ],
        },
        // p95
        p95: {
          $arrayElemAt: [
            { $sortArray: { input: '$responseTimes', sortBy: 1 } },
            { $floor: { $multiply: [0.95, { $size: '$responseTimes' }] } },
          ],
        },
      },
    },
  ]);

  // 3. Overall summary with percentiles
  const [summary] = await PerformanceLog.aggregate([
    matchStage,
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' },
        errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
        responseTimes: { $push: '$responseTime' },
      },
    },
    {
      $project: {
        totalRequests: 1,
        avgResponseTime: { $round: ['$avgResponseTime', 2] },
        maxResponseTime: 1,
        errorRate: {
          $cond: [
            { $eq: ['$totalRequests', 0] },
            0,
            {
              $round: [
                { $multiply: [{ $divide: ['$errors', '$totalRequests'] }, 100] },
                2,
              ],
            },
          ],
        },
        p95: {
          $arrayElemAt: [
            { $sortArray: { input: '$responseTimes', sortBy: 1 } },
            { $floor: { $multiply: [0.95, { $size: '$responseTimes' }] } },
          ],
        },
        p99: {
          $arrayElemAt: [
            { $sortArray: { input: '$responseTimes', sortBy: 1 } },
            { $floor: { $multiply: [0.99, { $size: '$responseTimes' }] } },
          ],
        },
      },
    },
  ]);

  // 4. Status code breakdown
  const statusCodes = await PerformanceLog.aggregate([
    matchStage,
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $and: [{ $gte: ['$statusCode', 200] }, { $lt: ['$statusCode', 300] }] }, then: '2xx' },
              { case: { $and: [{ $gte: ['$statusCode', 400] }, { $lt: ['$statusCode', 500] }] }, then: '4xx' },
              { case: { $gte: ['$statusCode', 500] }, then: '5xx' },
            ],
            default: 'other',
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // 5. User breakdown (admin only)
  let userBreakdown: unknown[] = [];
  if (req.user?.role === 'admin') {
    userBreakdown = await PerformanceLog.aggregate([
      matchStage,
      { $match: { userId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          userId: '$_id',
          email: { $arrayElemAt: ['$user.email', 0] },
          name: { $arrayElemAt: ['$user.name', 0] },
          count: 1,
          avgResponseTime: { $round: ['$avgResponseTime', 2] },
        },
      },
    ]);
  }

  res.json({
    success: true,
    client: { clientId: client.clientId, name: client.name, logoUrl: client.logoUrl },
    range,
    summary: summary || { totalRequests: 0, avgResponseTime: 0, maxResponseTime: 0, errorRate: 0, p95: 0, p99: 0 },
    timeSeries,
    endpoints,
    statusCodes,
    userBreakdown,
  });
};