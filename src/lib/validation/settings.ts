import { z } from "zod";

export const settingsSchema = z.object({
  theme: z.enum(["system", "light", "dark"]).default("system"),
  timezone: z.string().min(1).default("UTC"),
  reminderSettings: z.record(z.string(), z.unknown()).default({}),
  invalidDateBehavior: z
    .enum(["SKIP", "PREVIOUS_VALID_DAY", "NEXT_VALID_DAY"])
    .default("SKIP"),
  importPreferences: z.record(z.string(), z.unknown()).default({}),
});

export const settingsUpdateSchema = settingsSchema.partial();
