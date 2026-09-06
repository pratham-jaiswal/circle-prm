import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { Interaction } from "@/models/interaction";

import { requireUser } from "./auth";

export async function getInteractionById(interactionId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return Interaction.findOne({
    _id: interactionId,
    userId: user.id,
  });
}

export async function getInteractionByPublicId(publicId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return Interaction.findOne({
    publicId,
    userId: user.id,
  });
}

export async function listInteractions() {
  await connectToDatabase();
  const user = await requireUser();

  return Interaction.find({
    userId: user.id,
  })
    .sort({ date: -1 })
    .lean();
}

export async function listInteractionsForPerson(personId: string, limit = 20) {
  await connectToDatabase();
  const user = await requireUser();

  return Interaction.find({
    userId: user.id,
    personIds: personId,
  })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
}