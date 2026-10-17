import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { User } from '../../models/user-model.js';
import { Post } from '../../models/post-model.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';

describe('RBAC & Aggregations API Endpoints - Integration Tests', () => {
  const timestamp = Date.now();
  const regularUserData = {
    name: 'Normal User',
    email: `normal_${timestamp}@example.com`,
    password: 'password123',
    interests: ['javascript', 'testing'],
  };
  const adminUserData = {
    name: 'Admin User',
    email: `admin_${timestamp}@example.com`,
    password: 'password123',
    role: 'admin',
    interests: ['devops', 'testing'],
  };

  let userToken = '';
  let adminToken = '';
  let regularUserId = '';

  beforeAll(async () => {
    await connectDatabase();

    // Register normal user
    const resUser = await request(app).post('/api/auth/register').send(regularUserData);
    userToken = resUser.body.data.token;
    regularUserId = resUser.body.data.user._id;

    // Create admin user directly in DB (to assign role: 'admin')
    const adminUser = await User.create({
      name: adminUserData.name,
      email: adminUserData.email,
      password: adminUserData.password,
      role: 'admin',
      interests: adminUserData.interests,
    });

    // Login admin to get valid JWT
    const resAdmin = await request(app).post('/api/auth/login').send({
      email: adminUserData.email,
      password: adminUserData.password,
    });
    adminToken = resAdmin.body.data.token;

    // Create a sample post for regular user to test Scenario 2 ($lookup)
    await Post.create({
      title: `Test Post ${timestamp}`,
      content: 'This post is used to test MongoDB $lookup aggregation.',
      authorId: regularUserId,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: [regularUserData.email, adminUserData.email] } });
    await Post.deleteMany({ title: { $regex: new RegExp(`^Test Post ${timestamp}`) } });
    await disconnectDatabase();
  });

  describe('RBAC Guard Tests (/api/users)', () => {
    it('should forbid regular user from accessing Admin user management directory (403)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden/i);
    });

    it('should allow admin user to access user management directory (200)', async () => {
      const res = await request(app)
        .get('/api/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('Aggregation Scenario 1: Group by Interests (/api/aggregations/interests)', () => {
    it('should aggregate users grouped by interest using single pipeline (200)', async () => {
      const res = await request(app)
        .get('/api/aggregations/interests')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Verify structure: { interest: string, count: number, users: array }
      const testingGroup = res.body.data.find((g: { interest: string }) => g.interest === 'testing');
      expect(testingGroup).toBeDefined();
      expect(testingGroup.count).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(testingGroup.users)).toBe(true);
    });
  });

  describe('Aggregation Scenario 2: User Posts $lookup (/api/aggregations/users/:userId/posts)', () => {
    it('should fetch user and embed posts using $lookup aggregation (200)', async () => {
      const res = await request(app)
        .get(`/api/aggregations/users/${regularUserId}/posts`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(regularUserId);
      expect(Array.isArray(res.body.data.posts)).toBe(true);
      expect(res.body.data.posts.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalPosts).toBe(res.body.data.posts.length);
    });
  });

  describe('Business Workflow: Post Approval & Moderation (/api/posts)', () => {
    let createdPostId = '';

    it('should create post as pending when created by regular user (201)', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: `Pending Post ${timestamp}`,
          content: 'This post awaits administrative approval.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      createdPostId = res.body.data._id;
    });

    it('should forbid regular user from approving posts (403)', async () => {
      const res = await request(app)
        .patch(`/api/posts/${createdPostId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden/i);
    });

    it('should reject invalid status updates (400)', async () => {
      const res = await request(app)
        .patch(`/api/posts/${createdPostId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'super-approved' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin user to approve post (200)', async () => {
      const res = await request(app)
        .patch(`/api/posts/${createdPostId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.approvedBy).toBeDefined();
      expect(res.body.data.approvedAt).toBeDefined();
    });
  });
});

