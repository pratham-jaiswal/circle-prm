"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requireUser } from "@/lib/dal/auth";
import { relationshipCreateSchema } from "@/lib/validation/relationship";
import { Person } from "@/models/person";
import { Relationship } from "@/models/relationship";

export async function createRelationshipAction(formData: FormData) {
  await connectToDatabase();
  const user = await requireUser();

  const personAPublicId = String(formData.get("personAPublicId") || "").trim();
  const personBPublicId = String(formData.get("personBPublicId") || "").trim();

  const [personA, personB] = await Promise.all([
    Person.findOne({ userId: user.id, publicId: personAPublicId }).lean(),
    Person.findOne({ userId: user.id, publicId: personBPublicId }).lean(),
  ]);

  if (!personA || !personB) {
    throw new Error("Both people must exist in your workspace.");
  }

  const parsed = relationshipCreateSchema.safeParse({
    personAId: String(personA._id),
    personBId: String(personB._id),
    relationshipType: formData.get("relationshipType"),
    customRelationship: formData.get("customRelationship") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const relationship = await Relationship.create({
    ...parsed.data,
    userId: user.id,
  });

  revalidatePath("/relationships");
  revalidatePath("/connections");
  redirect(`/relationships/${relationship.publicId}`);
}

export async function updateRelationshipAction(
  relationshipPublicId: string,
  formData: FormData,
) {
  await connectToDatabase();
  const user = await requireUser();

  const personAPublicId = String(formData.get("personAPublicId") || "").trim();
  const personBPublicId = String(formData.get("personBPublicId") || "").trim();

  const [personA, personB] = await Promise.all([
    Person.findOne({ userId: user.id, publicId: personAPublicId }).lean(),
    Person.findOne({ userId: user.id, publicId: personBPublicId }).lean(),
  ]);

  if (!personA || !personB) {
    throw new Error("Both people must exist in your workspace.");
  }

  const parsed = relationshipCreateSchema.safeParse({
    personAId: String(personA._id),
    personBId: String(personB._id),
    relationshipType: formData.get("relationshipType"),
    customRelationship: formData.get("customRelationship") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const relationship = await Relationship.findOneAndUpdate(
    {
      publicId: relationshipPublicId,
      userId: user.id,
    },
    {
      $set: parsed.data,
    },
    { new: true, runValidators: true },
  );

  if (!relationship) {
    throw new Error("Unable to update relationship.");
  }

  revalidatePath("/relationships");
  revalidatePath(`/relationships/${relationshipPublicId}`);
  revalidatePath("/connections");
  redirect(`/relationships/${relationshipPublicId}`);
}

export async function deleteRelationshipAction(relationshipPublicId: string) {
  await connectToDatabase();
  const user = await requireUser();

  const relationship = await Relationship.findOneAndDelete({
    publicId: relationshipPublicId,
    userId: user.id,
  });

  if (!relationship) {
    throw new Error("Unable to delete relationship.");
  }

  revalidatePath("/relationships");
  revalidatePath("/connections");
  redirect("/relationships?notice=relationship-deleted");
}
