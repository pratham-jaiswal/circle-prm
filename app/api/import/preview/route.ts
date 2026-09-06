import { NextResponse } from "next/server";

import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { analyzeImportData } from "@/lib/import-export/import";
import { runImportMigrations } from "@/lib/import-export/migrations";
import { simpleImportSchema } from "@/lib/import-export/schema";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id || !session.user.email || !isEmailAllowed(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = simpleImportSchema.safeParse(body);

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
  const analysis = await analyzeImportData({
    userId: session.user.id,
    payload: migrated,
  });

  return NextResponse.json({
    ok: true,
    schemaVersion: migrated.schemaVersion,
    preview: analysis.preview,
    referenceSummary: analysis.referenceSummary,
    warning: "Preview only. No data has been written.",
  });
}

