import { z } from "zod";

export const noteCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  personIds: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  reminderId: z.string().optional(),
  archived: z.boolean().default(false),
});

export const noteUpdateSchema = noteCreateSchema.partial();
