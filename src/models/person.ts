import { Schema, model, models, type InferSchemaType } from "mongoose";

import { generatePublicId } from "@/lib/ids/generate-public-id";

const locationSchema = new Schema(
  {
    displayName: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false },
);

const phoneSchema = new Schema(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    label: { type: String, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const emailSchema = new Schema(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    label: { type: String, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const factSchema = new Schema(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    publicId: {
      type: String,
      default: () => generatePublicId("FACT"),
      immutable: true,
    },
    content: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const importantDateSchema = new Schema(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    publicId: {
      type: String,
      default: () => generatePublicId("DATE"),
      immutable: true,
    },
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    recurring: { type: Boolean, default: false },
  },
  { _id: false },
);

const linkSchema = new Schema(
  {
    id: { type: String, default: () => crypto.randomUUID() },
    publicId: {
      type: String,
      default: () => generatePublicId("LINK"),
      immutable: true,
    },
    type: { type: String, required: true, trim: true },
    label: { type: String, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const personSchema = new Schema(
  {
    publicId: {
      type: String,
      default: () => generatePublicId("PER"),
      immutable: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    fullName: { type: String, required: true, trim: true, index: true },
    aliases: { type: [String], default: [] },
    relationshipToMe: {
      type: {
        type: String,
        required: false,
        trim: true,
      },
      customRelationship: { type: String, trim: true },
    },
    circles: { type: [String], default: [] },
    dateOfBirth: {
      month: Number,
      day: Number,
      year: Number,
    },
    livesIn: locationSchema,
    from: locationSchema,
    howMet: { type: String, trim: true },
    interests: { type: [String], default: [] },
    phones: { type: [phoneSchema], default: [] },
    emails: { type: [emailSchema], default: [] },
    tags: { type: [String], default: [] },
    facts: { type: [factSchema], default: [] },
    importantDates: { type: [importantDateSchema], default: [] },
    links: { type: [linkSchema], default: [] },
    contactPreferences: {
      preferredMethods: { type: [String], default: [] },
      bestTime: { type: String, trim: true },
      notes: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "LOST_CONTACT", "ARCHIVED", "DECEASED"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true },
);

personSchema.index({ userId: 1, publicId: 1 }, { unique: true });
personSchema.index({ userId: 1, fullName: 1 });
personSchema.index({ userId: 1, tags: 1 });
personSchema.index({ userId: 1, circles: 1 });
personSchema.index({ userId: 1, status: 1 });

export type PersonDocument = InferSchemaType<typeof personSchema>;

export const Person = models.Person ?? model("Person", personSchema);