import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { User } from '../../models/user-model.js';
import { Note } from '../../models/note-model.js';
import { connectDatabase, disconnectDatabase } from '../../config/database.js';

describe('Notes API Endpoints (/api/notes) - CRUD & Authorization Tests', () => {
  const timestamp = Date.now();
  const userA = {
    name: 'Alice Tester',
    email: `alice_${timestamp}@example.com`,
    password: 'password123',
  };
  const userB = {
    name: 'Bob Tester',
    email: `bob_${timestamp}@example.com`,
    password: 'password123',
  };

  let tokenA = '';
  let tokenB = '';
  let noteAId = '';

  beforeAll(async () => {
    await connectDatabase();

    // Register User A
    const resA = await request(app).post('/api/auth/register').send(userA);
    tokenA = resA.body.data.token;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send(userB);
    tokenB = resB.body.data.token;
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ email: { $in: [userA.email, userB.email] } });
    await Note.deleteMany({ title: { $regex: new RegExp(`^Test Note ${timestamp}`) } });
    await disconnectDatabase();
  });

  describe('POST /api/notes', () => {
    it('should create a note for authenticated user', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: `Test Note ${timestamp} #1`,
          content: 'This note belongs to Alice.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.title).toBe(`Test Note ${timestamp} #1`);
      noteAId = res.body.data._id;
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/notes')
        .send({
          title: 'Unauthenticated Note',
          content: 'Should fail',
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 when title or content is empty', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: '',
          content: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/notes', () => {
    it("should list only the authenticated user's own notes with pagination metadata", async () => {
      const res = await request(app)
        .get('/api/notes?page=1&limit=5')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);

      // Verify returned notes belong to Alice
      const ids = res.body.data.map((n: { _id: string }) => n._id);
      expect(ids).toContain(noteAId);
    });

    it("should not return User A's notes when User B lists their notes", async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((n: { _id: string }) => n._id);
      expect(ids).not.toContain(noteAId);
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should retrieve a note by ID for its owner', async () => {
      const res = await request(app)
        .get(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(noteAId);
    });

    it("should return 403 Forbidden when User B attempts to access User A's note", async () => {
      const res = await request(app)
        .get(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update note title and content for owner', async () => {
      const updatedTitle = `Test Note ${timestamp} Updated`;
      const res = await request(app)
        .put(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: updatedTitle,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(updatedTitle);
    });

    it("should reject update attempt from User B on User A's note with 403 Forbidden", async () => {
      const res = await request(app)
        .put(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          title: 'Hacked by Bob',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it("should reject delete attempt from User B on User A's note with 403 Forbidden", async () => {
      const res = await request(app)
        .delete(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should delete note successfully for owner', async () => {
      const res = await request(app)
        .delete(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it no longer exists
      const verifyRes = await request(app)
        .get(`/api/notes/${noteAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(verifyRes.status).toBe(404);
    });
  });
});
