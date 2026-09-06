import { NextResponse } from "next/server";

import { isEmailAllowed } from "@/lib/auth/access";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getSession } from "@/lib/dal/auth";
import { noteCreateSchema } from "@/lib/validation/note";
import { Note } from "@/models/note";
import { Person } from "@/models/person";

export async function POST(request: Request) {
  await connectToDatabase();
  const session = await getSession();

  if (!session?.user?.id || !session.user.email || !isEmailAllowed(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const associatedPeople = Array.isArray(body?.associatedPeople)
    ? body.associatedPeople.filter((item: unknown): item is string => typeof item === "string")
    : [];

  const matchedPeople = await Person.find({
    userId: session.user.id,
    publicId: { $in: associatedPeople },
  })
    .select({ _id: 1 })
    .lean();

  const parsed = noteCreateSchema.safeParse({
    title: body?.title,
    content: body?.content,
    tags: Array.isArray(body?.tags) ? body.tags : [],
    personIds: matchedPeople.map((person) => String(person._id)),
    archived: Boolean(body?.archived),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const note = await Note.create({
    ...parsed.data,
    userId: session.user.id,
  });

  return NextResponse.json({
    ok: true,
    note: {
      publicId: note.publicId,
    },
  });
}
