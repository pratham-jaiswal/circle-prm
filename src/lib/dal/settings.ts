import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { Settings } from "@/models/settings";

import { requireUser } from "./auth";

export async function getUserSettings() {
  await connectToDatabase();
  const user = await requireUser();

  return Settings.findOne({
    userId: user.id,
  }).lean();
}