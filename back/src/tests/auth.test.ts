import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import 'dotenv/config';

const testUser = {
  name: 'Test User',
  email: 'testauth@example.com',
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!',
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
},30000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
},30000);

beforeEach(async () => {
  await User.deleteMany({});
  await RefreshToken.deleteMany({});
});

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const user = await User.findOne({ email: testUser.email });
    expect(user).toBeTruthy();
    expect(user?.isVerified).toBe(false);
  });

  it('should reject duplicate email', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
  });

  it('should reject invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...testUser, email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('should reject short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...testUser, password: '123', confirmPassword: '123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Create a verified user
    const user = new User({ name: testUser.name, email: testUser.email, password: testUser.password, isVerified: true });
    await user.save();
  });

  it('should login with valid credentials and set cookies', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should reject wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: 'WrongPassword!' });
    expect(res.status).toBe(401);
  });

  it('should reject unregistered email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'noone@example.com', password: testUser.password });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('should clear cookies on logout', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('should always return success (anti-enumeration)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'anyone@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/auth/verify-email/:token', () => {
  it('should verify email with valid token', async () => {
    const token = 'validtoken123';
    await User.create({
      name: 'Verify User',
      email: 'verify@example.com',
      password: 'Password123!',
      verificationToken: token,
      verificationTokenExpiry: new Date(Date.now() + 3600000),
    });

    const res = await request(app).get(`/api/auth/verify-email/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await User.findOne({ email: 'verify@example.com' });
    expect(user?.isVerified).toBe(true);
  });

  it('should reject expired token', async () => {
    const token = 'expiredtoken456';
    await User.create({
      name: 'Expired User',
      email: 'expired@example.com',
      password: 'Password123!',
      verificationToken: token,
      verificationTokenExpiry: new Date(Date.now() - 1000), // expired
    });

    const res = await request(app).get(`/api/auth/verify-email/${token}`);
    expect(res.status).toBe(400);
  });
});
