import { z } from "zod";

export const savedViewCreateSchema = z.object({
  name: z.string().min(1),
  filters: z.record(z.string(), z.unknown()),
});

export const savedViewUpdateSchema = savedViewCreateSchema.partial();
