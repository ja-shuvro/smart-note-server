import { z } from 'zod';

export const suggestTagsSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required for AI classification')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  content: z
    .string()
    .min(1, 'Content is required for AI classification')
    .max(10000, 'Content cannot exceed 10000 characters')
    .trim(),
});

export type SuggestTagsInput = z.infer<typeof suggestTagsSchema>;
