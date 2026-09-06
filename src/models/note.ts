import { Schema, model, models, type InferSchemaType } from "mongoose";

import { generatePublicId } from "@/lib/ids/generate-public-id";

const noteSchema = new Schema(
  {
    publicId: {
      type: String,
      default: () => generatePublicId("NOTE"),
      immutable: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    personIds: { type: [String], default: [], index: true },
    tags: { type: [String], default: [], index: true },
    reminderId: { type: String, trim: true },
    archived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

noteSchema.index({ userId: 1, publicId: 1 }, { unique: true });
noteSchema.index({ userId: 1, createdAt: -1 });

export type NoteDocument = InferSchemaType<typeof noteSchema>;

export const Note = models.Note ?? model("Note", noteSchema);