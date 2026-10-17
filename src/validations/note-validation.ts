import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters').trim(),
  content: z.string().min(1, 'Content is required').trim(),
});

export const updateNoteSchema = z
  .object({
    title: z.string().min(1, 'Title cannot be empty').max(200).trim().optional(),
    content: z.string().min(1, 'Content cannot be empty').trim().optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: 'At least one field (title or content) must be provided to update',
  });

export const listNotesQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  all: z.string().optional(), // 'true' for admin viewing all notes
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
