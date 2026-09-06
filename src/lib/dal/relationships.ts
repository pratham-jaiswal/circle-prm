import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { Relationship } from "@/models/relationship";

import { requireUser } from "./auth";

export async function getRelationshipById(relationshipId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return Relationship.findOne({
    _id: relationshipId,
    userId: user.id,
  });
}

export async function getRelationshipByPublicId(publicId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return Relationship.findOne({
    publicId,
    userId: user.id,
  });
}

export async function listRelationships() {
  await connectToDatabase();
  const user = await requireUser();

  return Relationship.find({
    userId: user.id,
  })
    .sort({ updatedAt: -1 })
    .lean();
}

export async function listRelationshipsForPerson(personId: string, limit = 30) {
  await connectToDatabase();
  const user = await requireUser();

  return Relationship.find({
    userId: user.id,
    $or: [{ personAId: personId }, { personBId: personId }],
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
}