import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { Reminder } from "@/models/reminder";

import { requireUser } from "./auth";

export async function getReminderById(reminderId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return Reminder.findOne({
    _id: reminderId,
    userId: user.id,
  });
}

export async function getReminderByPublicId(publicId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return Reminder.findOne({
    publicId,
    userId: user.id,
  });
}

export async function listReminders() {
  await connectToDatabase();
  const user = await requireUser();

  return Reminder.find({
    userId: user.id,
  })
    .sort({ date: 1 })
    .lean();
}

export async function listRemindersForPerson(personId: string, limit = 20) {
  await connectToDatabase();
  const user = await requireUser();

  return Reminder.find({
    userId: user.id,
    personIds: personId,
  })
    .sort({ date: 1 })
    .limit(limit)
    .lean();
}