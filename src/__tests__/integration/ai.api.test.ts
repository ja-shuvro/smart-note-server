import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';

describe('AI / ML Feature API Endpoints (/api/ai) - Integration Tests', () => {
  const timestamp = Date.now();
  let userToken = '';

  beforeAll(async () => {
    await connectDatabase();

    const res = await request(app).post('/api/auth/register').send({
      name: 'AI Tester',
      email: `aitester_${timestamp}@example.com`,
      password: 'password123',
      interests: ['testing', 'architecture'],
    });
    userToken = res.body.data.token;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should require authentication for AI tag suggestion (401)', async () => {
    const res = await request(app)
      .post('/api/ai/suggest-tags')
      .send({
        title: 'MongoDB Query Optimization',
        content: 'Explaining how IXSCAN avoids in-memory sort.',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject requests with missing title or content (400)', async () => {
    const res = await request(app)
      .post('/api/ai/suggest-tags')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: '',
        content: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should classify database content and suggest database tags (200)', async () => {
    const res = await request(app)
      .post('/api/ai/suggest-tags')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Deep Dive into MongoDB Aggregation Pipeline and Indexing',
        content: 'Using $unwind and $lookup stages alongside compound index scan on collections.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.category).toBe('Database');
    expect(Array.isArray(res.body.data.tags)).toBe(true);
    expect(res.body.data.tags.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.tags.some((t: string) => ['mongodb', 'indexing', 'database', 'aggregation', 'pipeline'].includes(t))).toBe(true);
    expect(res.body.data.confidence).toBeGreaterThanOrEqual(0.70);
    expect(['gemini-api', 'local-nlp']).toContain(res.body.data.engine);
  });

  it('should classify security content and suggest security tags (200)', async () => {
    const res = await request(app)
      .post('/api/ai/suggest-tags')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Securing REST APIs with JWT and Role Based Access Control',
        content: 'Implementing bcrypt hashing, signature verification, and RBAC authorization guards.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.category).toBe('Security');
    expect(Array.isArray(res.body.data.tags)).toBe(true);
    expect(res.body.data.tags.some((t: string) => ['jwt', 'auth', 'security', 'rbac'].includes(t))).toBe(true);
    expect(res.body.data.confidence).toBeGreaterThanOrEqual(0.70);
  });
});
