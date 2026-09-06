import { NextResponse } from "next/server";

import { isEmailAllowed } from "@/lib/auth/access";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getSession } from "@/lib/dal/auth";
import { noteUpdateSchema } from "@/lib/validation/note";
import { Note } from "@/models/note";
import { Person } from "@/models/person";

type Params = {
  params: Promise<{ noteId: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  await connectToDatabase();
  const session = await getSession();

  if (!session?.user?.id || !session.user.email || !isEmailAllowed(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;
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

  const parsed = noteUpdateSchema.safeParse({
    title: body?.title,
    content: body?.content,
    tags: Array.isArray(body?.tags) ? body.tags : undefined,
    personIds:
      associatedPeople.length > 0
        ? matchedPeople.map((person) => String(person._id))
        : undefined,
    archived: typeof body?.archived === "boolean" ? body.archived : undefined,
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

  const note = await Note.findOneAndUpdate(
    {
      publicId: noteId,
      userId: session.user.id,
    },
    {
      $set: parsed.data,
    },
    { new: true },
  );

  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  await connectToDatabase();
  const session = await getSession();

  if (!session?.user?.id || !session.user.email || !isEmailAllowed(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await params;

  const result = await Note.findOneAndDelete({
    publicId: noteId,
    userId: session.user.id,
  });

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
