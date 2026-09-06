import { z } from "zod";

export const reminderCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().min(1),
  time: z.string().default("00:00"),
  recurrenceType: z.enum(["ONCE", "WEEKLY", "MONTHLY", "YEARLY"]).default("ONCE"),
  recurrenceBehavior: z.enum(["SKIP", "PREVIOUS_VALID_DAY", "NEXT_VALID_DAY"]).optional(),
  personIds: z.array(z.string().min(1)).default([]),
  noteId: z.string().optional(),
  eventId: z.string().optional(),
  enabled: z.boolean().default(true),
});

export const reminderUpdateSchema = reminderCreateSchema.partial();
