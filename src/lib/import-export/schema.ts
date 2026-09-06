import { z } from "zod";

export const backupManifestSchema = z.object({
  app: z.literal("Personal Relationship Manager"),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string().datetime(),
});

export const simpleImportSchema = z.object({
  schemaVersion: z.number().int().positive().default(1),
  people: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  notes: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  interactions: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  reminders: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  relationships: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  events: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  savedViews: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export type SimpleImportInput = z.infer<typeof simpleImportSchema>;
