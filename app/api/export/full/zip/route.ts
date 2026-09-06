import JSZip from "jszip";
import { NextResponse } from "next/server";

import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { exportUserData } from "@/lib/import-export/export";

export async function GET() {
  const session = await getSession();

  if (!session?.user?.id || !session.user.email || !isEmailAllowed(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await exportUserData(session.user.id);
  const zip = new JSZip();

  zip.file("manifest.json", JSON.stringify(payload.manifest, null, 2));
  zip.file("people.json", JSON.stringify(payload.people, null, 2));
  zip.file("notes.json", JSON.stringify(payload.notes, null, 2));
  zip.file("interactions.json", JSON.stringify(payload.interactions, null, 2));
  zip.file("reminders.json", JSON.stringify(payload.reminders, null, 2));
  zip.file("relationships.json", JSON.stringify(payload.relationships, null, 2));
  zip.file("events.json", JSON.stringify(payload.events, null, 2));
  zip.file("saved-views.json", JSON.stringify(payload.savedViews, null, 2));
  zip.file("settings.json", JSON.stringify(payload.settings ?? {}, null, 2));

  const content = await zip.generateAsync({ type: "arraybuffer" });

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=relationship-manager-backup-${new Date().toISOString().slice(0, 10)}.zip`,
    },
  });
}
