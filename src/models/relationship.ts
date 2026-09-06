import { Schema, model, models, type InferSchemaType } from "mongoose";

import { generatePublicId } from "@/lib/ids/generate-public-id";

const relationshipSchema = new Schema(
  {
    publicId: {
      type: String,
      default: () => generatePublicId("REL"),
      immutable: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    personAId: { type: Schema.Types.ObjectId, required: true, index: true },
    personBId: { type: Schema.Types.ObjectId, required: true, index: true },
    pairKey: { type: String, required: true, immutable: true, index: true },
    relationshipType: { type: String, required: true, trim: true },
    customRelationship: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true },
);

relationshipSchema.pre("validate", function setPairKey() {
  if (
    this.personAId &&
    this.personBId &&
    String(this.personAId) === String(this.personBId)
  ) {
    throw new Error("A relationship must connect two different people.");
  }

  const [left, right] = [String(this.personAId), String(this.personBId)].sort();
  this.pairKey = `${left}:${right}`;
});

relationshipSchema.index({ userId: 1, publicId: 1 }, { unique: true });
relationshipSchema.index({ userId: 1, pairKey: 1 }, { unique: true });

export type RelationshipDocument = InferSchemaType<typeof relationshipSchema>;

export const Relationship =
  models.Relationship ?? model("Relationship", relationshipSchema);