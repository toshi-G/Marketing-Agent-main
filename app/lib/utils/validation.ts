import { z } from 'zod';

export const startWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  initialInput: z
    .object({
      targetGenre: z.string().min(1).optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
});
export type StartWorkflowInput = z.infer<typeof startWorkflowSchema>;

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  type: z.string().min(1),
  content: z.any(),
  performance: z.any().optional(),
  tags: z.array(z.string()).optional(),
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
