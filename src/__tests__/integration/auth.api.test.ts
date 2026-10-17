import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { User } from '../../models/user-model.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';

describe('Auth API Endpoints (/api/auth) - Integration Tests', () => {
  const timestamp = Date.now();
  const testUser = {
    name: 'Auth Test User',
    email: `test_auth_${timestamp}@example.com`,
    password: 'password123',
    interests: ['testing', 'vitest'],
  };

  let authToken = '';

  beforeAll(async () => {
    await connectDatabase();
    // Ensure clean state for this test email
    await User.deleteMany({ email: testUser.email });
  });

  afterAll(async () => {
    // Cleanup created test user
    await User.deleteMany({ email: testUser.email });
    await disconnectDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.password).toBeUndefined(); // Security: password never returned
    });

    it('should return 409 Conflict when attempting to register with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('should return 400 Bad Request when input fails schema validation', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'A', // too short (< 2)
          email: 'invalid-email',
          password: '123', // too short (< 6)
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in successfully with valid credentials and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      authToken = res.body.data.token;
    });

    it('should return 401 Unauthorized with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('should return 401 Unauthorized for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent_user_99999@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return authenticated user profile with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.role).toBe('user');
    });

    it('should return 401 Unauthorized when Bearer token is missing', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 Unauthorized when Bearer token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
