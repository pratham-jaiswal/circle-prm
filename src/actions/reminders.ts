"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requireUser } from "@/lib/dal/auth";
import { reminderCreateSchema } from "@/lib/validation/reminder";
import { Reminder } from "@/models/reminder";
import { Person } from "@/models/person";

function parseCsv(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createReminderAction(formData: FormData) {
  await connectToDatabase();
  const user = await requireUser();

  const requestedPeople = parseCsv(formData.get("associatedPeople"));
  const matchedPeople = await Person.find({
    userId: user.id,
    publicId: { $in: requestedPeople },
  })
    .select({ _id: 1 })
    .lean();

  const parsed = reminderCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    date: formData.get("date"),
    time: formData.get("time") || "00:00",
    recurrenceType: formData.get("recurrenceType") || "ONCE",
    recurrenceBehavior: formData.get("recurrenceBehavior") || undefined,
    personIds: matchedPeople.map((person) => String(person._id)),
    noteId: formData.get("noteId") || undefined,
    eventId: formData.get("eventId") || undefined,
    enabled: formData.get("enabled") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const reminder = await Reminder.create({
    ...parsed.data,
    date: new Date(parsed.data.date),
    userId: user.id,
  });

  revalidatePath("/reminders");
  redirect(`/reminders/${reminder.publicId}`);
}

export async function updateReminderAction(reminderPublicId: string, formData: FormData) {
  await connectToDatabase();
  const user = await requireUser();

  const requestedPeople = parseCsv(formData.get("associatedPeople"));
  const matchedPeople = await Person.find({
    userId: user.id,
    publicId: { $in: requestedPeople },
  })
    .select({ _id: 1 })
    .lean();

  const parsed = reminderCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    date: formData.get("date"),
    time: formData.get("time") || "00:00",
    recurrenceType: formData.get("recurrenceType") || "ONCE",
    recurrenceBehavior: formData.get("recurrenceBehavior") || undefined,
    personIds: matchedPeople.map((person) => String(person._id)),
    noteId: formData.get("noteId") || undefined,
    eventId: formData.get("eventId") || undefined,
    enabled: formData.get("enabled") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const reminder = await Reminder.findOneAndUpdate(
    {
      publicId: reminderPublicId,
      userId: user.id,
    },
    {
      $set: {
        ...parsed.data,
        date: new Date(parsed.data.date),
      },
    },
    { new: true },
  );

  if (!reminder) {
    throw new Error("Unable to update reminder.");
  }

  revalidatePath("/reminders");
  revalidatePath(`/reminders/${reminderPublicId}`);
  redirect(`/reminders/${reminderPublicId}`);
}

export async function toggleReminderEnabledAction(reminderPublicId: string, enabled: boolean) {
  await connectToDatabase();
  const user = await requireUser();

  const reminder = await Reminder.findOneAndUpdate(
    {
      publicId: reminderPublicId,
      userId: user.id,
    },
    {
      $set: { enabled },
    },
    { new: true },
  );

  if (!reminder) {
    throw new Error("Unable to update reminder.");
  }

  revalidatePath("/reminders");
  revalidatePath(`/reminders/${reminderPublicId}`);
}

export async function deleteReminderAction(reminderPublicId: string) {
  await connectToDatabase();
  const user = await requireUser();

  const reminder = await Reminder.findOneAndDelete({
    publicId: reminderPublicId,
    userId: user.id,
  });

  if (!reminder) {
    throw new Error("Unable to delete reminder.");
  }

  revalidatePath("/reminders");
  redirect("/reminders?notice=reminder-deleted");
}
