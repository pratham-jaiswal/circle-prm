"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requireUser } from "@/lib/dal/auth";
import { savedViewCreateSchema } from "@/lib/validation/saved-view";
import { SavedView } from "@/models/saved-view";

export type SavedViewActionState = {
  ok: boolean;
  message: string;
  savedView?: {
    publicId: string;
    name: string;
    filters: Record<string, unknown>;
  };
  deletedPublicId?: string;
};

export async function createSavedViewAction(
  _prevState: SavedViewActionState,
  formData: FormData,
): Promise<SavedViewActionState> {
  await connectToDatabase();
  const user = await requireUser();

  const rawFilters = String(formData.get("filters") || "{}");
  let filters: Record<string, unknown> = {};

  try {
    const parsed = JSON.parse(rawFilters);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      filters = parsed as Record<string, unknown>;
    }
  } catch {
    return { ok: false, message: "Filters must be valid JSON object." };
  }

  const parsed = savedViewCreateSchema.safeParse({
    name: formData.get("name"),
    filters,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  }

  const savedView = await SavedView.create({
    ...parsed.data,
    userId: user.id,
  });

  revalidatePath("/saved-views");

  return {
    ok: true,
    message: "Saved view created.",
    savedView: {
      publicId: savedView.publicId,
      name: savedView.name,
      filters: (savedView.filters ?? {}) as Record<string, unknown>,
    },
  };
}

export async function deleteSavedViewAction(
  _prevState: SavedViewActionState,
  formData: FormData,
): Promise<SavedViewActionState> {
  await connectToDatabase();
  const user = await requireUser();
  const savedViewPublicId = String(formData.get("publicId") || "").trim();

  if (!savedViewPublicId) {
    return { ok: false, message: "Missing saved view identifier." };
  }

  const result = await SavedView.findOneAndDelete({
    publicId: savedViewPublicId,
    userId: user.id,
  });

  if (!result) {
    return { ok: false, message: "Unable to delete saved view." };
  }

  revalidatePath("/saved-views");

  return {
    ok: true,
    message: "Saved view deleted.",
    deletedPublicId: savedViewPublicId,
  };
}
