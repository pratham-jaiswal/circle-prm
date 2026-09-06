import { Schema, model, models, type InferSchemaType } from "mongoose";

import { generatePublicId } from "@/lib/ids/generate-public-id";

const reminderSchema = new Schema(
  {
    publicId: {
      type: String,
      default: () => generatePublicId("REM"),
      immutable: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    date: { type: Date, required: true, index: true },
    time: { type: String, required: true, default: "00:00" },
    recurrenceType: {
      type: String,
      enum: ["ONCE", "WEEKLY", "MONTHLY", "YEARLY"],
      default: "ONCE",
      index: true,
    },
    recurrenceBehavior: {
      type: String,
      enum: ["SKIP", "PREVIOUS_VALID_DAY", "NEXT_VALID_DAY"],
    },
    personIds: { type: [String], default: [], index: true },
    noteId: { type: String, trim: true },
    eventId: { type: String, trim: true },
    enabled: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

reminderSchema.index({ userId: 1, publicId: 1 }, { unique: true });
reminderSchema.index({ userId: 1, date: 1 });

export type ReminderDocument = InferSchemaType<typeof reminderSchema>;

export const Reminder = models.Reminder ?? model("Reminder", reminderSchema);