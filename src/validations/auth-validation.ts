import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().email('Valid email address is required').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  interests: z.array(z.string().trim()).optional().default([]),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
