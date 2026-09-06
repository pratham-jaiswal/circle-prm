import { NextResponse } from "next/server";

import { isEmailAllowed } from "@/lib/auth/access";
import { connectToDatabase } from "@/lib/db/mongoose";
import { getSession } from "@/lib/dal/auth";
import { Event } from "@/models/event";
import { Interaction } from "@/models/interaction";
import { Note } from "@/models/note";
import { Person } from "@/models/person";
import { Relationship } from "@/models/relationship";
import { Reminder } from "@/models/reminder";

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  type: "person" | "note" | "interaction" | "event" | "reminder" | "relationship";
};

function buildRegex(query: string) {
  return new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export async function GET(request: Request) {
  await connectToDatabase();
  const session = await getSession();

  if (!session?.user?.id || !session.user.email || !isEmailAllowed(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ ok: true, results: [] as SearchResult[] });
  }

  const regex = buildRegex(q);
  const userId = session.user.id;

  const [people, notes, interactions, events, reminders, relationships] = await Promise.all([
    Person.find({
      userId,
      $or: [
        { fullName: regex },
        { aliases: regex },
        { interests: regex },
        { tags: regex },
        { circles: regex },
      ],
    })
      .select({ publicId: 1, fullName: 1, status: 1 })
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean(),
    Note.find({ userId, $or: [{ title: regex }, { content: regex }, { tags: regex }] })
      .select({ publicId: 1, title: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean(),
    Interaction.find({ userId, $or: [{ type: regex }, { summary: regex }, { tags: regex }] })
      .select({ publicId: 1, type: 1, date: 1 })
      .sort({ date: -1 })
      .limit(6)
      .lean(),
    Event.find({ userId, $or: [{ title: regex }, { description: regex }, { tags: regex }] })
      .select({ publicId: 1, title: 1, date: 1 })
      .sort({ date: -1 })
      .limit(6)
      .lean(),
    Reminder.find({ userId, $or: [{ title: regex }, { description: regex }] })
      .select({ publicId: 1, title: 1, date: 1, enabled: 1 })
      .sort({ date: 1 })
      .limit(6)
      .lean(),
    Relationship.find({ userId, $or: [{ relationshipType: regex }, { notes: regex }] })
      .select({ publicId: 1, relationshipType: 1, pairKey: 1 })
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean(),
  ]);

  const results: SearchResult[] = [
    ...people.map((item) => ({
      id: item.publicId,
      type: "person" as const,
      title: item.fullName,
      subtitle: item.status,
      href: `/people/${item.publicId}`,
    })),
    ...notes.map((item) => ({
      id: item.publicId,
      type: "note" as const,
      title: item.title,
      href: `/notes/${item.publicId}`,
    })),
    ...interactions.map((item) => ({
      id: item.publicId,
      type: "interaction" as const,
      title: item.type,
      subtitle: new Date(item.date).toLocaleDateString(),
      href: `/interactions/${item.publicId}`,
    })),
    ...events.map((item) => ({
      id: item.publicId,
      type: "event" as const,
      title: item.title,
      subtitle: new Date(item.date).toLocaleDateString(),
      href: `/events/${item.publicId}`,
    })),
    ...reminders.map((item) => ({
      id: item.publicId,
      type: "reminder" as const,
      title: item.title,
      subtitle: `${item.enabled ? "enabled" : "disabled"} • ${new Date(item.date).toLocaleDateString()}`,
      href: `/reminders/${item.publicId}`,
    })),
    ...relationships.map((item) => ({
      id: item.publicId,
      type: "relationship" as const,
      title: item.relationshipType,
      subtitle: item.pairKey,
      href: `/relationships/${item.publicId}`,
    })),
  ];

  return NextResponse.json({ ok: true, results: results.slice(0, 30) });
}
