import { NextResponse } from "next/server";

import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { analyzeImportData } from "@/lib/import-export/import";
import { runImportMigrations } from "@/lib/import-export/migrations";
import { simpleImportSchema } from "@/lib/import-export/schema";

function normalizePeoplePayload(body: unknown) {
  if (Array.isArray(body)) {
    return {
      schemaVersion: 1,
      people: body,
    };
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return {
        schemaVersion: typeof record.schemaVersion === "number" ? record.schemaVersion : 1,
        people: record.data,
      };
    }
  }

  return body;
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id || !session.user.email || !isEmailAllowed(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const normalized = normalizePeoplePayload(body);
  const parsed = simpleImportSchema.safeParse(normalized);

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
    payload: {
      ...migrated,
      notes: [],
      interactions: [],
      reminders: [],
      relationships: [],
      events: [],
      savedViews: [],
      settings: undefined,
    },
  });

  return NextResponse.json({
    ok: true,
    schemaVersion: migrated.schemaVersion,
    preview: analysis.preview,
    referenceSummary: analysis.referenceSummary,
    warning: "People preview only. No data has been written.",
  });
}
