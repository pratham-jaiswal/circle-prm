import { Schema, model, models, type InferSchemaType } from "mongoose";

import { generatePublicId } from "@/lib/ids/generate-public-id";

const eventSchema = new Schema(
  {
    publicId: {
      type: String,
      default: () => generatePublicId("EVT"),
      immutable: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    personIds: { type: [String], default: [], index: true },
    description: { type: String },
    tags: { type: [String], default: [], index: true },
  },
  { timestamps: true },
);

eventSchema.index({ userId: 1, publicId: 1 }, { unique: true });
eventSchema.index({ userId: 1, date: -1 });

export type EventDocument = InferSchemaType<typeof eventSchema>;

export const Event = models.Event ?? model("Event", eventSchema);