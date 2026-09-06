import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { Note } from "@/models/note";

import { requireUser } from "./auth";

export async function getNoteById(noteId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return Note.findOne({
    _id: noteId,
    userId: user.id,
  });
}

export async function getNoteByPublicId(publicId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return Note.findOne({
    publicId,
    userId: user.id,
  });
}

export async function listNotes() {
  await connectToDatabase();
  const user = await requireUser();

  return Note.find({
    userId: user.id,
  })
    .sort({ updatedAt: -1 })
    .lean();
}

export async function listNotesForPerson(personId: string, limit = 20) {
  await connectToDatabase();
  const user = await requireUser();

  return Note.find({
    userId: user.id,
    personIds: personId,
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
}