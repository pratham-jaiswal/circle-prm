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

import type { SimpleImportInput } from "./schema";

export type ImportConflictPolicy = "overwrite" | "skip" | "duplicate";

type PersonRefIssue = {
  issueId: string;
  entity: "notes" | "interactions" | "events" | "reminders";
  item: string;
  reference: string;
  type: "unresolved" | "ambiguous";
  matches?: Array<{ publicId: string; fullName: string }>;
};

export type ImportPersonResolution = {
  issueId: string;
  action: "map" | "skip" | "create";
  publicId?: string;
  fullName?: string;
};

type IndexedPerson = {
  id: string;
  publicId: string;
  fullName: string;
  aliases: string[];
};

type PeopleIndexes = {
  byPublicId: Map<string, IndexedPerson>;
  byFullName: Map<string, IndexedPerson[]>;
  byAlias: Map<string, IndexedPerson[]>;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function cleanRecord(record: Record<string, unknown>) {
  const { _id, id, userId, createdAt, updatedAt, ...rest } = record;
  void _id;
  void id;
  void userId;
  void createdAt;
  void updatedAt;
  return rest;
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function buildPeopleIndexes(people: IndexedPerson[]): PeopleIndexes {
  const byPublicId = new Map<string, IndexedPerson>();
  const byFullName = new Map<string, IndexedPerson[]>();
  const byAlias = new Map<string, IndexedPerson[]>();

  for (const person of people) {
    byPublicId.set(person.publicId, person);

    const nameKey = normalizeKey(person.fullName);
    const nameList = byFullName.get(nameKey) ?? [];
    nameList.push(person);
    byFullName.set(nameKey, nameList);

    for (const alias of person.aliases) {
      const aliasKey = normalizeKey(alias);
      const aliasList = byAlias.get(aliasKey) ?? [];
      aliasList.push(person);
      byAlias.set(aliasKey, aliasList);
    }
  }

  return { byPublicId, byFullName, byAlias };
}

function resolvePersonReference(
  token: string,
  indexes: PeopleIndexes,
):
  | { type: "resolved"; personId: string }
  | { type: "unresolved" }
  | { type: "ambiguous"; matches: Array<{ publicId: string; fullName: string }> } {
  const trimmed = token.trim();
  if (!trimmed) {
    return { type: "unresolved" };
  }

  const byPublicId = indexes.byPublicId.get(trimmed);
  if (byPublicId) {
    return { type: "resolved", personId: byPublicId.id };
  }

  const nameMatches = indexes.byFullName.get(normalizeKey(trimmed)) ?? [];
  if (nameMatches.length === 1) {
    return { type: "resolved", personId: nameMatches[0].id };
  }
  if (nameMatches.length > 1) {
    return {
      type: "ambiguous",
      matches: nameMatches.map((person) => ({
        publicId: person.publicId,
        fullName: person.fullName,
      })),
    };
  }

  const aliasMatches = indexes.byAlias.get(normalizeKey(trimmed)) ?? [];
  if (aliasMatches.length === 1) {
    return { type: "resolved", personId: aliasMatches[0].id };
  }
  if (aliasMatches.length > 1) {
    return {
      type: "ambiguous",
      matches: aliasMatches.map((person) => ({
        publicId: person.publicId,
        fullName: person.fullName,
      })),
    };
  }

  return { type: "unresolved" };
}

function extractPeopleRefs(item: Record<string, unknown>) {
  const raw = item.people ?? item.personPublicIds;
  return asStringList(raw);
}

function resolvePeopleForEntity(
  refs: string[],
  indexes: PeopleIndexes,
  entity: PersonRefIssue["entity"],
  item: string,
  issues: PersonRefIssue[],
  resolutionMap?: Map<string, ImportPersonResolution>,
  createdPeopleByIssueId?: Map<string, string>,
) {
  const resolvedIds = new Set<string>();

  for (const ref of refs) {
    const issueId = `${entity}::${item}::${normalizeKey(ref)}`;
    const resolution = resolutionMap?.get(issueId);
    if (resolution?.action === "skip") {
      continue;
    }

    if (resolution?.action === "map" && resolution.publicId) {
      const mapped = indexes.byPublicId.get(resolution.publicId);
      if (mapped) {
        resolvedIds.add(mapped.id);
        continue;
      }
    }

    if (resolution?.action === "create") {
      const createdPersonId = createdPeopleByIssueId?.get(issueId);
      if (createdPersonId) {
        resolvedIds.add(createdPersonId);
        continue;
      }
    }

    const resolved = resolvePersonReference(ref, indexes);
    if (resolved.type === "resolved") {
      resolvedIds.add(resolved.personId);
      continue;
    }

    if (resolved.type === "ambiguous") {
      issues.push({
        issueId,
        entity,
        item,
        reference: ref,
        type: "ambiguous",
        matches: resolved.matches,
      });
      continue;
    }

    issues.push({
      issueId,
      entity,
      item,
      reference: ref,
      type: "unresolved",
    });
  }

  return Array.from(resolvedIds);
}

export async function analyzeImportData({
  userId,
  payload,
}: {
  userId: string;
  payload: SimpleImportInput;
}) {
  await connectToDatabase();

  const [existingPeople, existingNotes, existingInteractions, existingEvents, existingReminders] =
    await Promise.all([
      Person.find({ userId }).select({ _id: 1, publicId: 1, fullName: 1, aliases: 1 }).lean(),
      Note.find({ userId }).select({ publicId: 1 }).lean(),
      Interaction.find({ userId }).select({ publicId: 1 }).lean(),
      Event.find({ userId }).select({ publicId: 1 }).lean(),
      Reminder.find({ userId }).select({ publicId: 1 }).lean(),
    ]);

  const syntheticImportedPeople: IndexedPerson[] = payload.people
    .map((record, index) => {
      const data = cleanRecord(record);
      const fullName = asString(data.fullName);
      if (!fullName) {
        return null;
      }

      return {
        id: `import-${index}`,
        publicId: asString(data.publicId) ?? `IMPORTED_${index}`,
        fullName,
        aliases: asStringList(data.aliases),
      };
    })
    .filter((item): item is IndexedPerson => Boolean(item));

  const currentPeople: IndexedPerson[] = existingPeople.map((person) => ({
    id: String(person._id),
    publicId: person.publicId,
    fullName: person.fullName,
    aliases: asStringList(person.aliases),
  }));

  const indexes = buildPeopleIndexes([...currentPeople, ...syntheticImportedPeople]);

  const issues: PersonRefIssue[] = [];

  for (const note of payload.notes) {
    const data = cleanRecord(note);
    resolvePeopleForEntity(
      extractPeopleRefs(data),
      indexes,
      "notes",
      asString(data.publicId) ?? asString(data.title) ?? "Untitled Note",
      issues,
    );
  }

  for (const interaction of payload.interactions) {
    const data = cleanRecord(interaction);
    resolvePeopleForEntity(
      extractPeopleRefs(data),
      indexes,
      "interactions",
      asString(data.publicId) ?? asString(data.type) ?? "Interaction",
      issues,
    );
  }

  for (const event of payload.events) {
    const data = cleanRecord(event);
    resolvePeopleForEntity(
      extractPeopleRefs(data),
      indexes,
      "events",
      asString(data.publicId) ?? asString(data.title) ?? "Event",
      issues,
    );
  }

  for (const reminder of payload.reminders) {
    const data = cleanRecord(reminder);
    resolvePeopleForEntity(
      extractPeopleRefs(data),
      indexes,
      "reminders",
      asString(data.publicId) ?? asString(data.title) ?? "Reminder",
      issues,
    );
  }

  const existingPeoplePublicIds = new Set(existingPeople.map((item) => item.publicId));
  const existingPeopleNames = new Set(existingPeople.map((item) => normalizeKey(item.fullName)));
  const peopleConflicts = payload.people.filter((item) => {
    const data = cleanRecord(item);
    const publicId = asString(data.publicId);
    if (publicId) {
      return existingPeoplePublicIds.has(publicId);
    }
    const fullName = asString(data.fullName);
    return fullName ? existingPeopleNames.has(normalizeKey(fullName)) : false;
  }).length;

  const existingNoteIds = new Set(existingNotes.map((item) => item.publicId));
  const existingInteractionIds = new Set(existingInteractions.map((item) => item.publicId));
  const existingEventIds = new Set(existingEvents.map((item) => item.publicId));
  const existingReminderIds = new Set(existingReminders.map((item) => item.publicId));

  const notesConflicts = payload.notes.filter((item) => {
    const data = cleanRecord(item);
    const publicId = asString(data.publicId);
    return publicId ? existingNoteIds.has(publicId) : false;
  }).length;

  const interactionsConflicts = payload.interactions.filter((item) => {
    const data = cleanRecord(item);
    const publicId = asString(data.publicId);
    return publicId ? existingInteractionIds.has(publicId) : false;
  }).length;

  const eventsConflicts = payload.events.filter((item) => {
    const data = cleanRecord(item);
    const publicId = asString(data.publicId);
    return publicId ? existingEventIds.has(publicId) : false;
  }).length;

  const remindersConflicts = payload.reminders.filter((item) => {
    const data = cleanRecord(item);
    const publicId = asString(data.publicId);
    return publicId ? existingReminderIds.has(publicId) : false;
  }).length;

  return {
    preview: {
      people: payload.people.length,
      notes: payload.notes.length,
      interactions: payload.interactions.length,
      reminders: payload.reminders.length,
      relationships: payload.relationships.length,
      events: payload.events.length,
      savedViews: payload.savedViews.length,
      settings: payload.settings ? 1 : 0,
      peopleConflicts,
      notesConflicts,
      interactionsConflicts,
      eventsConflicts,
      remindersConflicts,
    },
    referenceSummary: {
      unresolved: issues.filter((issue) => issue.type === "unresolved").length,
      ambiguous: issues.filter((issue) => issue.type === "ambiguous").length,
      issues: issues.slice(0, 50),
    },
  };
}

export async function commitImportData({
  userId,
  payload,
  conflictPolicy,
  personResolutions,
}: {
  userId: string;
  payload: SimpleImportInput;
  conflictPolicy: ImportConflictPolicy;
  personResolutions?: ImportPersonResolution[];
}) {
  await connectToDatabase();

  type EntityKey =
    | "people"
    | "notes"
    | "interactions"
    | "reminders"
    | "relationships"
    | "events"
    | "savedViews"
    | "settings";

  type EntityCounts = {
    created: number;
    updated: number;
    skipped: number;
  };

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const issues: PersonRefIssue[] = [];
  const byEntity: Record<EntityKey, EntityCounts> = {
    people: { created: 0, updated: 0, skipped: 0 },
    notes: { created: 0, updated: 0, skipped: 0 },
    interactions: { created: 0, updated: 0, skipped: 0 },
    reminders: { created: 0, updated: 0, skipped: 0 },
    relationships: { created: 0, updated: 0, skipped: 0 },
    events: { created: 0, updated: 0, skipped: 0 },
    savedViews: { created: 0, updated: 0, skipped: 0 },
    settings: { created: 0, updated: 0, skipped: 0 },
  };

  const bump = (entity: EntityKey, key: keyof EntityCounts) => {
    byEntity[entity][key] += 1;
  };

  const peopleByPublicId = new Map<string, string>();

  const existingPeople = await Person.find({ userId }).select({ _id: 1, publicId: 1 }).lean();
  for (const person of existingPeople) {
    peopleByPublicId.set(person.publicId, String(person._id));
  }

  for (const item of payload.people) {
    const data = cleanRecord(item);
    const publicId = asString(data.publicId);
    const fullName = asString(data.fullName);
    if (!fullName) {
      continue;
    }

    const updateDoc = {
      ...data,
      fullName,
      aliases: asStringList(data.aliases),
      circles: asStringList(data.circles),
      interests: asStringList(data.interests),
      tags: asStringList(data.tags),
      userId,
    };

    if (publicId) {
      const existing = await Person.findOne({ userId, publicId }).select({ _id: 1 }).lean();
      if (existing) {
        if (conflictPolicy === "skip") {
          peopleByPublicId.set(publicId, String(existing._id));
          skipped += 1;
          bump("people", "skipped");
        } else if (conflictPolicy === "duplicate") {
          const createdPerson = await Person.create(updateDoc);
          peopleByPublicId.set(createdPerson.publicId, String(createdPerson._id));
          created += 1;
          bump("people", "created");
        } else {
          await Person.updateOne({ _id: existing._id, userId }, { $set: updateDoc });
          peopleByPublicId.set(publicId, String(existing._id));
          updated += 1;
          bump("people", "updated");
        }
      } else {
        const createdPerson = await Person.create({ ...updateDoc, publicId });
        peopleByPublicId.set(createdPerson.publicId, String(createdPerson._id));
        created += 1;
        bump("people", "created");
      }
      continue;
    }

    const existing = await Person.findOne({ userId, fullName }).select({ _id: 1, publicId: 1 }).lean();
    if (existing) {
      if (conflictPolicy === "skip") {
        peopleByPublicId.set(existing.publicId, String(existing._id));
        skipped += 1;
        bump("people", "skipped");
      } else if (conflictPolicy === "duplicate") {
        const createdPerson = await Person.create(updateDoc);
        peopleByPublicId.set(createdPerson.publicId, String(createdPerson._id));
        created += 1;
        bump("people", "created");
      } else {
        await Person.updateOne({ _id: existing._id, userId }, { $set: updateDoc });
        peopleByPublicId.set(existing.publicId, String(existing._id));
        updated += 1;
        bump("people", "updated");
      }
    } else {
      const createdPerson = await Person.create(updateDoc);
      peopleByPublicId.set(createdPerson.publicId, String(createdPerson._id));
      created += 1;
      bump("people", "created");
    }
  }

  const peopleForReferenceResolution = await Person.find({ userId })
    .select({ _id: 1, publicId: 1, fullName: 1, aliases: 1 })
    .lean();

  const indexes = buildPeopleIndexes(
    peopleForReferenceResolution.map((person) => ({
      id: String(person._id),
      publicId: person.publicId,
      fullName: person.fullName,
      aliases: asStringList(person.aliases),
    })),
  );
  const resolutionMap = new Map<string, ImportPersonResolution>(
    (personResolutions ?? []).map((item) => [item.issueId, item]),
  );
  const createdPeopleByIssueId = new Map<string, string>();

  for (const resolution of personResolutions ?? []) {
    if (resolution.action !== "create") {
      continue;
    }

    const fullName = resolution.fullName?.trim();
    if (!fullName) {
      continue;
    }

    const createdPerson = await Person.create({
      userId,
      fullName,
      aliases: [],
      circles: [],
      interests: [],
      tags: [],
      status: "ACTIVE",
    });

    const indexed: IndexedPerson = {
      id: String(createdPerson._id),
      publicId: createdPerson.publicId,
      fullName: createdPerson.fullName,
      aliases: [],
    };

    indexes.byPublicId.set(indexed.publicId, indexed);
    const fullNameKey = normalizeKey(indexed.fullName);
    const fullNameMatches = indexes.byFullName.get(fullNameKey) ?? [];
    fullNameMatches.push(indexed);
    indexes.byFullName.set(fullNameKey, fullNameMatches);

    createdPeopleByIssueId.set(resolution.issueId, indexed.id);
    created += 1;
    bump("people", "created");
  }

  async function upsertMany(
    entity: EntityKey,
    model: typeof Note | typeof Interaction | typeof Reminder | typeof Relationship | typeof Event | typeof SavedView,
    items: Array<Record<string, unknown>>,
    mapFn: (item: Record<string, unknown>) => Record<string, unknown>,
  ) {
    for (const item of items) {
      const data = cleanRecord(item);
      const publicId = asString(data.publicId);
      const updateDoc = {
        ...mapFn(data),
        userId,
      };

      if (publicId) {
        const existing = await model.findOne({ userId, publicId }).select({ _id: 1 }).lean();
        if (existing) {
          if (conflictPolicy === "skip") {
            skipped += 1;
            bump(entity, "skipped");
          } else if (conflictPolicy === "duplicate") {
            await model.create(updateDoc);
            created += 1;
            bump(entity, "created");
          } else {
            await model.updateOne({ _id: existing._id, userId }, { $set: updateDoc });
            updated += 1;
            bump(entity, "updated");
          }
        } else {
          await model.create({ ...updateDoc, publicId });
          created += 1;
          bump(entity, "created");
        }
      } else {
        await model.create(updateDoc);
        created += 1;
        bump(entity, "created");
      }
    }
  }

  await upsertMany("notes", Note, payload.notes, (item) => ({
    title: asString(item.title) ?? "Untitled Note",
    content: asString(item.content) ?? "",
    tags: asStringList(item.tags),
    personIds: resolvePeopleForEntity(
      extractPeopleRefs(item),
      indexes,
      "notes",
      asString(item.publicId) ?? asString(item.title) ?? "Untitled Note",
      issues,
      resolutionMap,
      createdPeopleByIssueId,
    ),
    archived: Boolean(item.archived),
  }));

  await upsertMany("interactions", Interaction, payload.interactions, (item) => ({
    type: asString(item.type) ?? "Other",
    date: asString(item.date) ? new Date(String(item.date)) : new Date(),
    time: asString(item.time),
    durationMinutes: typeof item.durationMinutes === "number" ? item.durationMinutes : undefined,
    summary: asString(item.summary),
    detailedNotes: asString(item.detailedNotes),
    tags: asStringList(item.tags),
    personIds: resolvePeopleForEntity(
      extractPeopleRefs(item),
      indexes,
      "interactions",
      asString(item.publicId) ?? asString(item.type) ?? "Interaction",
      issues,
      resolutionMap,
      createdPeopleByIssueId,
    ),
  }));

  await upsertMany("events", Event, payload.events, (item) => ({
    title: asString(item.title) ?? "Untitled Event",
    date: asString(item.date) ? new Date(String(item.date)) : new Date(),
    description: asString(item.description),
    tags: asStringList(item.tags),
    personIds: resolvePeopleForEntity(
      extractPeopleRefs(item),
      indexes,
      "events",
      asString(item.publicId) ?? asString(item.title) ?? "Event",
      issues,
      resolutionMap,
      createdPeopleByIssueId,
    ),
  }));

  await upsertMany("reminders", Reminder, payload.reminders, (item) => ({
    title: asString(item.title) ?? "Untitled Reminder",
    description: asString(item.description),
    date: asString(item.date) ? new Date(String(item.date)) : new Date(),
    time: asString(item.time) ?? "00:00",
    recurrenceType: asString(item.recurrenceType) ?? "ONCE",
    recurrenceBehavior: asString(item.recurrenceBehavior),
    personIds: resolvePeopleForEntity(
      extractPeopleRefs(item),
      indexes,
      "reminders",
      asString(item.publicId) ?? asString(item.title) ?? "Reminder",
      issues,
      resolutionMap,
      createdPeopleByIssueId,
    ),
    enabled: item.enabled !== false,
  }));

  await upsertMany("savedViews", SavedView, payload.savedViews, (item) => ({
    name: asString(item.name) ?? "Saved View",
    filters:
      item.filters && typeof item.filters === "object"
        ? item.filters
        : {},
  }));

  for (const item of payload.relationships) {
    const data = cleanRecord(item);
    const personARef = asString(data.personAPublicId);
    const personBRef = asString(data.personBPublicId);
    if (!personARef || !personBRef) {
      continue;
    }

    const personAId = peopleByPublicId.get(personARef);
    const personBId = peopleByPublicId.get(personBRef);
    if (!personAId || !personBId || personAId === personBId) {
      continue;
    }

    const [left, right] = [personAId, personBId].sort();
    const pairKey = `${left}:${right}`;
    const publicId = asString(data.publicId);

    const updateDoc = {
      userId,
      personAId,
      personBId,
      pairKey,
      relationshipType: asString(data.relationshipType) ?? "Other",
      customRelationship: asString(data.customRelationship),
      notes: asString(data.notes),
    };

    if (publicId) {
      const existing = await Relationship.findOne({ userId, publicId }).select({ _id: 1 }).lean();
      if (existing) {
        if (conflictPolicy === "skip") {
          skipped += 1;
          bump("relationships", "skipped");
        } else if (conflictPolicy === "duplicate") {
          await Relationship.create(updateDoc);
          created += 1;
          bump("relationships", "created");
        } else {
          await Relationship.updateOne({ _id: existing._id, userId }, { $set: updateDoc });
          updated += 1;
          bump("relationships", "updated");
        }
      } else {
        await Relationship.create({ ...updateDoc, publicId });
        created += 1;
        bump("relationships", "created");
      }
      continue;
    }

    const existingPair = await Relationship.findOne({ userId, pairKey }).select({ _id: 1 }).lean();
    if (existingPair) {
      if (conflictPolicy === "skip") {
        skipped += 1;
        bump("relationships", "skipped");
      } else if (conflictPolicy === "duplicate") {
        await Relationship.create(updateDoc);
        created += 1;
        bump("relationships", "created");
      } else {
        await Relationship.updateOne({ _id: existingPair._id, userId }, { $set: updateDoc });
        updated += 1;
        bump("relationships", "updated");
      }
    } else {
      await Relationship.create(updateDoc);
      created += 1;
      bump("relationships", "created");
    }
  }

  if (payload.settings && typeof payload.settings === "object") {
    const existingSettings = await Settings.findOne({ userId }).select({ _id: 1 }).lean();
    await Settings.findOneAndUpdate(
      { userId },
      {
        userId,
        ...cleanRecord(payload.settings),
      },
      { upsert: true, setDefaultsOnInsert: true },
    );

    if (existingSettings) {
      updated += 1;
      bump("settings", "updated");
    } else {
      created += 1;
      bump("settings", "created");
    }
  }

  return {
    created,
    updated,
    skipped,
    byEntity,
    warnings: {
      unresolved: issues.filter((issue) => issue.type === "unresolved").length,
      ambiguous: issues.filter((issue) => issue.type === "ambiguous").length,
      issues: issues.slice(0, 50),
    },
  };
}
