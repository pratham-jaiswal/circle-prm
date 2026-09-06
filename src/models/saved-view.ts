import { Schema, model, models, type InferSchemaType } from "mongoose";

import { generatePublicId } from "@/lib/ids/generate-public-id";

const savedViewSchema = new Schema(
  {
    publicId: {
      type: String,
      default: () => generatePublicId("SVW"),
      immutable: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    filters: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

savedViewSchema.index({ userId: 1, publicId: 1 }, { unique: true });
savedViewSchema.index({ userId: 1, name: 1 });

export type SavedViewDocument = InferSchemaType<typeof savedViewSchema>;

export const SavedView = models.SavedView ?? model("SavedView", savedViewSchema);