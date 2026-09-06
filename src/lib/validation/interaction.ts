import { z } from "zod";

export const interactionCreateSchema = z.object({
  personIds: z.array(z.string().min(1)).default([]),
  type: z.string().min(1),
  date: z.string().min(1),
  time: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  summary: z.string().optional(),
  detailedNotes: z.string().optional(),
  tags: z.array(z.string().min(1)).default([]),
});

export const interactionUpdateSchema = interactionCreateSchema.partial();
