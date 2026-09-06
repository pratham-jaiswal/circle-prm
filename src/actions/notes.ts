"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requireUser } from "@/lib/dal/auth";
import { noteCreateSchema } from "@/lib/validation/note";
import { Note } from "@/models/note";
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

export async function createNoteAction(formData: FormData) {
  await connectToDatabase();
  const user = await requireUser();

  const requestedPeople = parseCsv(formData.get("associatedPeople"));
  const matchedPeople = await Person.find({
    userId: user.id,
    publicId: { $in: requestedPeople },
  })
    .select({ _id: 1 })
    .lean();

  const parsed = noteCreateSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    tags: parseCsv(formData.get("tags")),
    personIds: matchedPeople.map((person) => String(person._id)),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const note = await Note.create({
    ...parsed.data,
    userId: user.id,
  });

  revalidatePath("/notes");
  redirect(`/notes/${note.publicId}`);
}

export async function deleteNoteAction(notePublicId: string) {
  await connectToDatabase();
  const user = await requireUser();

  const note = await Note.findOneAndDelete({
    publicId: notePublicId,
    userId: user.id,
  });

  if (!note) {
    throw new Error("Unable to delete note.");
  }

  revalidatePath("/notes");
  redirect("/notes?notice=note-deleted");
}
