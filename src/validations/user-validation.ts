import { z } from 'zod';

export const adminCreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'admin']).default('user'),
  interests: z.array(z.string().trim()).optional().default([]),
});

export const adminUpdateUserSchema = z
  .object({
    name: z.string().min(2).max(100).trim().optional(),
    role: z.enum(['user', 'admin']).optional(),
    interests: z.array(z.string().trim()).optional(),
  })
  .refine((data) => data.name !== undefined || data.role !== undefined || data.interests !== undefined, {
    message: 'At least one field (name, role, or interests) must be provided to update',
  });

export const listUsersQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
});

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
