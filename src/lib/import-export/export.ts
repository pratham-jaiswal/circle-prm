import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { Event } from "@/models/event";
import { Interaction } from "@/models/interaction";
import { Note } from "@/models/note";
import { Person } from "@/models/person";
import { Relationship } from "@/models/relationship";
import { Reminder } from "@/models/reminder";
import { SavedView } from "@/models/saved-view";
import { Settings } from "@/models/settings";

type ExportData = {
  manifest: {
    app: "Personal Relationship Manager";
    schemaVersion: 1;
    exportedAt: string;
  };
  people: unknown[];
  notes: unknown[];
  interactions: unknown[];
  reminders: unknown[];
  relationships: unknown[];
  events: unknown[];
  savedViews: unknown[];
  settings: unknown | null;
};

type EntityExportData = {
  manifest: {
    app: "Personal Relationship Manager";
    schemaVersion: 1;
    exportedAt: string;
    scope: "people" | "notes";
  };
  data: unknown[];
};

function buildManifest() {
  return {
    app: "Personal Relationship Manager" as const,
    schemaVersion: 1 as const,
    exportedAt: new Date().toISOString(),
  };
}

export async function exportUserData(userId: string): Promise<ExportData> {
  await connectToDatabase();

  const [people, notes, interactions, reminders, relationships, events, savedViews, settings] =
    await Promise.all([
      Person.find({ userId }).lean(),
      Note.find({ userId }).lean(),
      Interaction.find({ userId }).lean(),
      Reminder.find({ userId }).lean(),
      Relationship.find({ userId }).lean(),
      Event.find({ userId }).lean(),
      SavedView.find({ userId }).lean(),
      Settings.findOne({ userId }).lean(),
    ]);

  return {
    manifest: buildManifest(),
    people,
    notes,
    interactions,
    reminders,
    relationships,
    events,
    savedViews,
    settings,
  };
}

export async function exportPeopleData(userId: string): Promise<EntityExportData> {
  await connectToDatabase();
  const people = await Person.find({ userId }).lean();

  return {
    manifest: {
      ...buildManifest(),
      scope: "people",
    },
    data: people,
  };
}

export async function exportNotesData(userId: string): Promise<EntityExportData> {
  await connectToDatabase();
  const notes = await Note.find({ userId }).lean();

  return {
    manifest: {
      ...buildManifest(),
      scope: "notes",
    },
    data: notes,
  };
}
