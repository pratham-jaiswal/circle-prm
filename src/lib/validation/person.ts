import { z } from "zod";

const locationSchema = z.object({
  displayName: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

const phoneSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  value: z.string().min(1),
});

const emailSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  value: z.string().email(),
});

const factSchema = z.object({
  id: z.string().optional(),
  publicId: z.string().optional(),
  content: z.string().min(1),
  category: z.string().optional(),
});

const dateSchema = z.object({
  id: z.string().optional(),
  publicId: z.string().optional(),
  title: z.string().min(1),
  date: z.string().min(1),
  recurring: z.boolean().optional(),
});

const linkSchema = z.object({
  id: z.string().optional(),
  publicId: z.string().optional(),
  type: z.string().min(1),
  label: z.string().optional(),
  url: z.string().url(),
});

const dateOfBirthSchema = z.object({
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  year: z.number().int().min(1).max(9999).optional(),
});

const relationshipToMeSchema = z.object({
  type: z.string().min(1),
  customRelationship: z.string().optional(),
});

const contactPreferencesSchema = z.object({
  preferredMethods: z.array(z.string().min(1)).default([]),
  bestTime: z.string().optional(),
  notes: z.string().optional(),
});

export const personCreateSchema = z.object({
  fullName: z.string().min(1),
  aliases: z.array(z.string().min(1)).default([]),
  relationshipToMe: relationshipToMeSchema.optional(),
  circles: z.array(z.string().min(1)).default([]),
  dateOfBirth: dateOfBirthSchema.optional(),
  livesIn: locationSchema.optional(),
  from: locationSchema.optional(),
  howMet: z.string().optional(),
  interests: z.array(z.string().min(1)).default([]),
  phones: z.array(phoneSchema).default([]),
  emails: z.array(emailSchema).default([]),
  tags: z.array(z.string().min(1)).default([]),
  facts: z.array(factSchema).default([]),
  importantDates: z.array(dateSchema).default([]),
  links: z.array(linkSchema).default([]),
  contactPreferences: contactPreferencesSchema.optional(),
});

export const personUpdateSchema = personCreateSchema.partial();

export type PersonCreateInput = z.infer<typeof personCreateSchema>;