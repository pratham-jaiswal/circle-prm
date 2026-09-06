import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { Event } from "@/models/event";

import { requireUser } from "./auth";

export async function getEventById(eventId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return Event.findOne({
    _id: eventId,
    userId: user.id,
  });
}

export async function getEventByPublicId(publicId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return Event.findOne({
    publicId,
    userId: user.id,
  });
}

export async function listEvents() {
  await connectToDatabase();
  const user = await requireUser();

  return Event.find({
    userId: user.id,
  })
    .sort({ date: -1 })
    .lean();
}

export async function listEventsForPerson(personId: string, limit = 20) {
  await connectToDatabase();
  const user = await requireUser();

  return Event.find({
    userId: user.id,
    personIds: personId,
  })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
}