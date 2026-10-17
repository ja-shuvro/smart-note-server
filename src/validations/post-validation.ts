import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1, 'Post title is required').max(200, 'Title cannot exceed 200 characters').trim(),
  content: z.string().min(1, 'Post content is required').trim(),
});

export const listPostsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['pending', 'approved', 'rejected', 'all']).optional(),
});

export const updatePostStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be pending, approved, or rejected' }),
  }),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostStatusInput = z.infer<typeof updatePostStatusSchema>;
