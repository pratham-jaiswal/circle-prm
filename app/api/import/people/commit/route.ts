import { NextResponse } from "next/server";

import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import type { ImportPersonResolution } from "@/lib/import-export/import";
import { commitImportData } from "@/lib/import-export/import";
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
    if (record.payload && typeof record.payload === "object") {
      const payload = record.payload as Record<string, unknown>;
      if (Array.isArray(payload.data)) {
        return {
          ...record,
          payload: {
            schemaVersion: typeof payload.schemaVersion === "number" ? payload.schemaVersion : 1,
            people: payload.data,
          },
        };
      }
    }

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
  const conflictPolicy =
    (normalized as { conflictPolicy?: unknown })?.conflictPolicy === "skip" ||
    (normalized as { conflictPolicy?: unknown })?.conflictPolicy === "duplicate"
      ? ((normalized as { conflictPolicy: "skip" | "duplicate" }).conflictPolicy)
      : "overwrite";

  const payloadRaw =
    normalized && typeof normalized === "object" && "payload" in normalized
      ? (normalized as { payload?: unknown }).payload
      : normalized;

  const parsed = simpleImportSchema.safeParse(payloadRaw);
  const personResolutions = Array.isArray((normalized as { personResolutions?: unknown })?.personResolutions)
    ? ((normalized as { personResolutions: unknown[] }).personResolutions).filter(
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
  const scopedPayload = {
    ...migrated,
    notes: [],
    interactions: [],
    reminders: [],
    relationships: [],
    events: [],
    savedViews: [],
    settings: undefined,
  };

  const result = await commitImportData({
    userId: session.user.id,
    payload: scopedPayload,
    conflictPolicy,
    personResolutions,
  });

  return NextResponse.json({
    ok: true,
    conflictPolicy,
    ...result,
  });
}
