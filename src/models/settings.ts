import { Schema, model, models, type InferSchemaType } from "mongoose";

const settingsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    theme: {
      type: String,
      enum: ["system", "light", "dark"],
      default: "system",
    },
    timezone: { type: String, default: "UTC" },
    reminderSettings: { type: Schema.Types.Mixed, default: {} },
    invalidDateBehavior: {
      type: String,
      enum: ["SKIP", "PREVIOUS_VALID_DAY", "NEXT_VALID_DAY"],
      default: "SKIP",
    },
    importPreferences: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export type SettingsDocument = InferSchemaType<typeof settingsSchema>;

export const Settings = models.Settings ?? model("Settings", settingsSchema);