import { z } from "zod";

export const relationshipCreateSchema = z.object({
  personAId: z.string().min(1),
  personBId: z.string().min(1),
  relationshipType: z.string().min(1),
  customRelationship: z.string().optional(),
  notes: z.string().optional(),
});

export const relationshipUpdateSchema = relationshipCreateSchema.partial();
