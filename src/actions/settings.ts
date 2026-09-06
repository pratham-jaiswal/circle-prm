"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requireUser } from "@/lib/dal/auth";
import { settingsSchema } from "@/lib/validation/settings";
import { Settings } from "@/models/settings";

export async function updateSettingsAction(formData: FormData) {
  await connectToDatabase();
  const user = await requireUser();

  const reminderOffsets =
    typeof formData.get("defaultReminderOffsetsDays") === "string"
      ? String(formData.get("defaultReminderOffsetsDays"))
          .split(",")
          .map((item) => Number(item.trim()))
          .filter((item) => Number.isFinite(item) && item >= 0)
      : [];

  const importDefaultConflictPolicy =
    formData.get("importDefaultConflictPolicy") === "skip" ||
    formData.get("importDefaultConflictPolicy") === "duplicate"
      ? formData.get("importDefaultConflictPolicy")
      : "overwrite";

  const importAutoCreateFromUnresolved = formData.get("importAutoCreateFromUnresolved") === "on";

  const parsed = settingsSchema.safeParse({
    theme: formData.get("theme") || "system",
    timezone: formData.get("timezone") || "UTC",
    invalidDateBehavior: formData.get("invalidDateBehavior") || "SKIP",
    reminderSettings: {
      defaultOffsetsDays: reminderOffsets,
    },
    importPreferences: {
      defaultConflictPolicy: importDefaultConflictPolicy,
      autoCreateFromUnresolved: importAutoCreateFromUnresolved,
    },
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  await Settings.findOneAndUpdate(
    { userId: user.id },
    {
      userId: user.id,
      ...parsed.data,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  revalidatePath("/settings");
}
