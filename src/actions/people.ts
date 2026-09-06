"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requireUser } from "@/lib/dal/auth";
import { personCreateSchema } from "@/lib/validation/person";
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

export async function createPersonAction(formData: FormData) {
  await connectToDatabase();
  const user = await requireUser();

  const parsed = personCreateSchema.safeParse({
    fullName: formData.get("fullName"),
    aliases: parseCsv(formData.get("aliases")),
    circles: parseCsv(formData.get("circles")),
    interests: parseCsv(formData.get("interests")),
    tags: parseCsv(formData.get("tags")),
    howMet: formData.get("howMet") || undefined,
    relationshipToMe:
      typeof formData.get("relationshipType") === "string" &&
      formData.get("relationshipType")
        ? {
            type: String(formData.get("relationshipType")),
          }
        : undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const person = await Person.create({
    ...parsed.data,
    userId: user.id,
  });

  revalidatePath("/people");
  redirect(`/people/${person.publicId}`);
}

function parseNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function updatePersonAction(personPublicId: string, formData: FormData) {
  await connectToDatabase();
  const user = await requireUser();

  const parsed = personCreateSchema.safeParse({
    fullName: formData.get("fullName"),
    aliases: parseCsv(formData.get("aliases")),
    circles: parseCsv(formData.get("circles")),
    interests: parseCsv(formData.get("interests")),
    tags: parseCsv(formData.get("tags")),
    howMet: formData.get("howMet") || undefined,
    relationshipToMe:
      typeof formData.get("relationshipType") === "string" &&
      formData.get("relationshipType")
        ? {
            type: String(formData.get("relationshipType")),
            customRelationship: String(formData.get("customRelationship") || "") || undefined,
          }
        : undefined,
    dateOfBirth:
      parseNumber(formData.get("birthMonth")) && parseNumber(formData.get("birthDay"))
        ? {
            month: parseNumber(formData.get("birthMonth")),
            day: parseNumber(formData.get("birthDay")),
            year: parseNumber(formData.get("birthYear")),
          }
        : undefined,
    livesIn:
      typeof formData.get("livesInDisplay") === "string" && formData.get("livesInDisplay")
        ? {
            displayName: String(formData.get("livesInDisplay")),
            city: String(formData.get("livesInCity") || "") || undefined,
            state: String(formData.get("livesInState") || "") || undefined,
            country: String(formData.get("livesInCountry") || "") || undefined,
          }
        : undefined,
    from:
      typeof formData.get("fromDisplay") === "string" && formData.get("fromDisplay")
        ? {
            displayName: String(formData.get("fromDisplay")),
            city: String(formData.get("fromCity") || "") || undefined,
            state: String(formData.get("fromState") || "") || undefined,
            country: String(formData.get("fromCountry") || "") || undefined,
          }
        : undefined,
    phones: parseCsv(formData.get("phones")).map((value) => ({ value })),
    emails: parseCsv(formData.get("emails")).map((value) => ({ value })),
    facts: parseCsv(formData.get("facts")).map((content) => ({ content })),
    links: parseCsv(formData.get("links")).map((url) => ({ type: "Other", url })),
    contactPreferences:
      typeof formData.get("bestTime") === "string" && formData.get("bestTime")
        ? {
            preferredMethods: parseCsv(formData.get("preferredMethods")),
            bestTime: String(formData.get("bestTime")),
            notes: String(formData.get("contactPreferenceNotes") || "") || undefined,
          }
        : undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const person = await Person.findOneAndUpdate(
    {
      publicId: personPublicId,
      userId: user.id,
    },
    {
      $set: parsed.data,
    },
    { new: true },
  );

  if (!person) {
    throw new Error("Unable to update person.");
  }

  revalidatePath("/people");
  revalidatePath(`/people/${personPublicId}`);
  redirect(`/people/${personPublicId}`);
}

export async function updatePersonStatusAction(
  personPublicId: string,
  status: "ACTIVE" | "LOST_CONTACT" | "ARCHIVED" | "DECEASED",
) {
  await connectToDatabase();
  const user = await requireUser();

  const person = await Person.findOneAndUpdate(
    {
      publicId: personPublicId,
      userId: user.id,
    },
    {
      $set: { status },
    },
    { new: true },
  );

  if (!person) {
    throw new Error("Unable to update person status.");
  }

  revalidatePath("/people");
  revalidatePath(`/people/${personPublicId}`);
}

export async function deletePersonAction(personPublicId: string) {
  await connectToDatabase();
  const user = await requireUser();

  const person = await Person.findOneAndDelete({
    publicId: personPublicId,
    userId: user.id,
  });

  if (!person) {
    throw new Error("Unable to delete person.");
  }

  revalidatePath("/people");
  redirect("/people?notice=person-deleted");
}
