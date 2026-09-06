import { NextResponse } from "next/server";

import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import type { ImportPersonResolution } from "@/lib/import-export/import";
import { commitImportData } from "@/lib/import-export/import";
import { runImportMigrations } from "@/lib/import-export/migrations";
import { simpleImportSchema } from "@/lib/import-export/schema";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id || !session.user.email || !isEmailAllowed(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const conflictPolicy =
    body?.conflictPolicy === "skip" || body?.conflictPolicy === "duplicate"
      ? body.conflictPolicy
      : "overwrite";
  const parsed = simpleImportSchema.safeParse(body?.payload ?? body);
  const personResolutions = Array.isArray(body?.personResolutions)
    ? body.personResolutions.filter(
        (item: unknown): item is ImportPersonResolution =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as { issueId?: unknown }).issueId === "string" &&
          (((item as { action?: unknown }).action === "skip") ||
            ((item as { action?: unknown }).action === "map" &&
              typeof (item as { publicId?: unknown }).publicId === "string") ||
            ((item as { action?: unknown }).action === "create" &&
              typeof (item as { fullName?: unknown }).fullName === "string" &&
              (item as { fullName: string }).fullName.trim().length > 0)),
      )
    : undefined;

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const migrated = runImportMigrations(parsed.data);
  const result = await commitImportData({
    userId: session.user.id,
    payload: migrated,
    conflictPolicy,
    personResolutions,
  });

  return NextResponse.json({
    ok: true,
    conflictPolicy,
    ...result,
  });
}
