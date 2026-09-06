"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requireUser } from "@/lib/dal/auth";
import { eventCreateSchema } from "@/lib/validation/event";
import { Event } from "@/models/event";
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

export async function createEventAction(formData: FormData) {
  await connectToDatabase();
  const user = await requireUser();

  const requestedPeople = parseCsv(formData.get("associatedPeople"));
  const matchedPeople = await Person.find({
    userId: user.id,
    publicId: { $in: requestedPeople },
  })
    .select({ _id: 1 })
    .lean();

  const parsed = eventCreateSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    personIds: matchedPeople.map((person) => String(person._id)),
    description: formData.get("description") || undefined,
    tags: parseCsv(formData.get("tags")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const event = await Event.create({
    ...parsed.data,
    date: new Date(parsed.data.date),
    userId: user.id,
  });

  revalidatePath("/events");
  redirect(`/events/${event.publicId}`);
}

export async function updateEventAction(eventPublicId: string, formData: FormData) {
  await connectToDatabase();
  const user = await requireUser();

  const requestedPeople = parseCsv(formData.get("associatedPeople"));
  const matchedPeople = await Person.find({
    userId: user.id,
    publicId: { $in: requestedPeople },
  })
    .select({ _id: 1 })
    .lean();

  const parsed = eventCreateSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    personIds: matchedPeople.map((person) => String(person._id)),
    description: formData.get("description") || undefined,
    tags: parseCsv(formData.get("tags")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const event = await Event.findOneAndUpdate(
    {
      publicId: eventPublicId,
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

  if (!event) {
    throw new Error("Unable to update event.");
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventPublicId}`);
  redirect(`/events/${eventPublicId}`);
}

export async function deleteEventAction(eventPublicId: string) {
  await connectToDatabase();
  const user = await requireUser();

  const event = await Event.findOneAndDelete({
    publicId: eventPublicId,
    userId: user.id,
  });

  if (!event) {
    throw new Error("Unable to delete event.");
  }

  revalidatePath("/events");
  redirect("/events?notice=event-deleted");
}
