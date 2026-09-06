import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { SavedView } from "@/models/saved-view";

import { requireUser } from "./auth";

export async function getSavedViewById(savedViewId: string) {
  await connectToDatabase();
  const user = await requireUser();

  return SavedView.findOne({
    _id: savedViewId,
    userId: user.id,
  });
}

export async function listSavedViews() {
  await connectToDatabase();
  const user = await requireUser();

  return SavedView.find({
    userId: user.id,
  })
    .sort({ updatedAt: -1 })
    .lean();
}