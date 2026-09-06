import { z } from "zod";

export const eventCreateSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  personIds: z.array(z.string().min(1)).default([]),
  description: z.string().optional(),
  tags: z.array(z.string().min(1)).default([]),
});

export const eventUpdateSchema = eventCreateSchema.partial();
