"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requireUser } from "@/lib/dal/auth";
import { interactionCreateSchema } from "@/lib/validation/interaction";
import { Interaction } from "@/models/interaction";
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

export async function createInteractionAction(formData: FormData) {
  await connectToDatabase();
  const user = await requireUser();

  const requestedPeople = parseCsv(formData.get("associatedPeople"));
  const matchedPeople = await Person.find({
    userId: user.id,
    publicId: { $in: requestedPeople },
  })
    .select({ _id: 1 })
    .lean();

  const parsed = interactionCreateSchema.safeParse({
    personIds: matchedPeople.map((person) => String(person._id)),
    type: formData.get("type"),
    date: formData.get("date"),
    time: formData.get("time") || undefined,
    durationMinutes:
      typeof formData.get("durationMinutes") === "string" &&
      formData.get("durationMinutes")
        ? Number(formData.get("durationMinutes"))
        : undefined,
    summary: formData.get("summary") || undefined,
    detailedNotes: formData.get("detailedNotes") || undefined,
    tags: parseCsv(formData.get("tags")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const interaction = await Interaction.create({
    ...parsed.data,
    date: new Date(parsed.data.date),
    userId: user.id,
  });

  revalidatePath("/interactions");
  redirect(`/interactions/${interaction.publicId}`);
}

export async function updateInteractionAction(interactionPublicId: string, formData: FormData) {
  await connectToDatabase();
  const user = await requireUser();

  const requestedPeople = parseCsv(formData.get("associatedPeople"));
  const matchedPeople = await Person.find({
    userId: user.id,
    publicId: { $in: requestedPeople },
  })
    .select({ _id: 1 })
    .lean();

  const parsed = interactionCreateSchema.safeParse({
    personIds: matchedPeople.map((person) => String(person._id)),
    type: formData.get("type"),
    date: formData.get("date"),
    time: formData.get("time") || undefined,
    durationMinutes:
      typeof formData.get("durationMinutes") === "string" &&
      formData.get("durationMinutes")
        ? Number(formData.get("durationMinutes"))
        : undefined,
    summary: formData.get("summary") || undefined,
    detailedNotes: formData.get("detailedNotes") || undefined,
    tags: parseCsv(formData.get("tags")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const interaction = await Interaction.findOneAndUpdate(
    {
      publicId: interactionPublicId,
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

  if (!interaction) {
    throw new Error("Unable to update interaction.");
  }

  revalidatePath("/interactions");
  revalidatePath(`/interactions/${interactionPublicId}`);
  redirect(`/interactions/${interactionPublicId}`);
}

export async function deleteInteractionAction(interactionPublicId: string) {
  await connectToDatabase();
  const user = await requireUser();

  const interaction = await Interaction.findOneAndDelete({
    publicId: interactionPublicId,
    userId: user.id,
  });

  if (!interaction) {
    throw new Error("Unable to delete interaction.");
  }

  revalidatePath("/interactions");
  redirect("/interactions?notice=interaction-deleted");
}
