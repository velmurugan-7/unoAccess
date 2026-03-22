import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { OAuthClient } from '../models/OAuthClient';
import { PerformanceLog } from '../models/PerformanceLog';
import { encrypt } from '../utils/encryption';
import 'dotenv/config';

const testClientId = 'test-monitor-client';
const testClientSecret = 'test-monitor-secret';
let testClientDbId: mongoose.Types.ObjectId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
}, 30000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}, 30000);

beforeEach(async () => {
  await OAuthClient.deleteMany({});
  await PerformanceLog.deleteMany({});

  const client = await OAuthClient.create({
    name: 'Test Monitor App',
    clientId: testClientId,
    clientSecret: encrypt(testClientSecret),
    redirectUris: ['http://localhost:3001/callback'],
    scopes: ['openid'],
    isActive: true,
    createdBy: new mongoose.Types.ObjectId(),
  });
  testClientDbId = client._id;
});

describe('POST /api/monitoring/logs', () => {
  const makeBasicAuth = () =>
    'Basic ' + Buffer.from(`${testClientId}:${testClientSecret}`).toString('base64');

  it('should ingest a batch of logs with Basic auth', async () => {
    const logs = [
      { endpoint: '/api/data', method: 'GET', responseTime: 45, statusCode: 200, userAgent: 'Jest/1.0', timestamp: new Date().toISOString() },
      { endpoint: '/api/users', method: 'POST', responseTime: 120, statusCode: 201, userAgent: 'Jest/1.0', timestamp: new Date().toISOString() },
    ];

    const res = await request(app)
      .post('/api/monitoring/logs')
      .set('Authorization', makeBasicAuth())
      .send({ logs });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ingested).toBe(2);

    const stored = await PerformanceLog.find({ clientId: testClientDbId });
    expect(stored).toHaveLength(2);
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/monitoring/logs')
      .set('Authorization', 'Basic ' + Buffer.from('bad:creds').toString('base64'))
      .send({ logs: [] });

    expect(res.status).toBe(401);
  });

  it('should reject empty logs array', async () => {
    const res = await request(app)
      .post('/api/monitoring/logs')
      .set('Authorization', makeBasicAuth())
      .send({ logs: [] });

    expect(res.status).toBe(400);
  });

  it('should reject oversized batches', async () => {
    const logs = Array.from({ length: 1001 }, (_, i) => ({
      endpoint: `/api/${i}`,
      method: 'GET',
      responseTime: 10,
      statusCode: 200,
      userAgent: '',
      timestamp: new Date().toISOString(),
    }));

    const res = await request(app)
      .post('/api/monitoring/logs')
      .set('Authorization', makeBasicAuth())
      .send({ logs });

    expect(res.status).toBe(400);
  });
});
