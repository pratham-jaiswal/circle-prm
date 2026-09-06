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

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename=relationship-manager-export-${new Date().toISOString().slice(0, 10)}.json`,
    },
  });
}

