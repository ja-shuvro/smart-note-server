import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../../validations/auth-validation.js';
import { createNoteSchema, updateNoteSchema } from '../../validations/note-validation.js';

describe('Validation Schemas (Unit Tests)', () => {
  describe('Auth Validation', () => {
    it('should validate valid registration payload', () => {
      const validPayload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        interests: ['node', 'react'],
      };
      const result = registerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('jane@example.com');
      }
    });

    it('should reject invalid email in registration', () => {
      const invalidPayload = {
        name: 'Jane Doe',
        email: 'not-an-email',
        password: 'password123',
      };
      const result = registerSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject password with less than 6 characters', () => {
      const invalidPayload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: '123',
      };
      const result = registerSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should validate valid login payload', () => {
      const validPayload = {
        email: 'jane@example.com',
        password: 'password123',
      };
      const result = loginSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject login payload with missing password', () => {
      const invalidPayload = {
        email: 'jane@example.com',
        password: '',
      };
      const result = loginSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Note Validation', () => {
    it('should validate valid note creation payload', () => {
      const validPayload = {
        title: 'Interview Preparation',
        content: 'Review MongoDB indexes and RBAC architecture.',
      };
      const result = createNoteSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Interview Preparation');
      }
    });

    it('should reject note creation with empty title or content', () => {
      expect(createNoteSchema.safeParse({ title: '', content: 'Some content' }).success).toBe(false);
      expect(createNoteSchema.safeParse({ title: 'Some title', content: '' }).success).toBe(false);
    });

    it('should reject note creation with title longer than 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      const result = createNoteSchema.safeParse({ title: longTitle, content: 'Some content' });
      expect(result.success).toBe(false);
    });

    it('should accept note update with only title or only content', () => {
      expect(updateNoteSchema.safeParse({ title: 'New Title' }).success).toBe(true);
      expect(updateNoteSchema.safeParse({ content: 'New Content' }).success).toBe(true);
    });

    it('should reject note update with empty object', () => {
      const result = updateNoteSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
