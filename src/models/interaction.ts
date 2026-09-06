import { Schema, model, models, type InferSchemaType } from "mongoose";

import { generatePublicId } from "@/lib/ids/generate-public-id";

const interactionSchema = new Schema(
  {
    publicId: {
      type: String,
      default: () => generatePublicId("INT"),
      immutable: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    personIds: { type: [String], default: [], index: true },
    type: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    time: { type: String, trim: true },
    durationMinutes: { type: Number },
    summary: { type: String, trim: true },
    detailedNotes: { type: String },
    tags: { type: [String], default: [], index: true },
  },
  { timestamps: true },
);

interactionSchema.index({ userId: 1, publicId: 1 }, { unique: true });
interactionSchema.index({ userId: 1, date: -1 });

export type InteractionDocument = InferSchemaType<typeof interactionSchema>;

export const Interaction =
  models.Interaction ?? model("Interaction", interactionSchema);