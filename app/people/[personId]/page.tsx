import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deletePersonAction, updatePersonStatusAction } from "@/actions/people";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { listEventsForPerson } from "@/lib/dal/events";
import { listInteractionsForPerson } from "@/lib/dal/interactions";
import { listNotesForPerson } from "@/lib/dal/notes";
import { getPersonByPublicId, listPeopleByIds } from "@/lib/dal/people";
import { listRelationshipsForPerson } from "@/lib/dal/relationships";
import { listRemindersForPerson } from "@/lib/dal/reminders";

type PersonPageProps = {
  params: Promise<{ personId: string }>;
};

export default async function PersonPage({ params }: PersonPageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const { personId } = await params;
  const person = await getPersonByPublicId(personId);

  if (!person) {
    notFound();
  }

  const personObjectId = String(person._id);

  const [notes, interactions, events, reminders, relationships] = await Promise.all([
    listNotesForPerson(personObjectId, 12),
    listInteractionsForPerson(personObjectId, 12),
    listEventsForPerson(personObjectId, 12),
    listRemindersForPerson(personObjectId, 12),
    listRelationshipsForPerson(personObjectId, 20),
  ]);

  const relatedPersonIds = Array.from(
    new Set(
      relationships.flatMap((item) => {
        const left = String(item.personAId);
        const right = String(item.personBId);
        return [left, right].filter((id) => id !== personObjectId);
      }),
    ),
  );

  const relatedPeople = await listPeopleByIds(relatedPersonIds);
  const relatedById = new Map(relatedPeople.map((item) => [String(item._id), item]));

  const timeline = [
    ...notes.map((note) => ({
      kind: "note" as const,
      id: note.publicId,
      date: note.updatedAt ? new Date(note.updatedAt) : new Date(),
      title: note.title,
      subtitle: note.tags.join(", "),
      href: `/notes/${note.publicId}`,
    })),
    ...interactions.map((interaction) => ({
      kind: "interaction" as const,
      id: interaction.publicId,
      date: new Date(interaction.date),
      title: interaction.summary || interaction.type,
      subtitle: interaction.type,
      href: `/interactions/${interaction.publicId}`,
    })),
    ...events.map((event) => ({
      kind: "event" as const,
      id: event.publicId,
      date: new Date(event.date),
      title: event.title,
      subtitle: "Event",
      href: `/events/${event.publicId}`,
    })),
    ...reminders.map((reminder) => ({
      kind: "reminder" as const,
      id: reminder.publicId,
      date: new Date(reminder.date),
      title: reminder.title,
      subtitle: reminder.enabled ? "Reminder enabled" : "Reminder disabled",
      href: `/reminders/${reminder.publicId}`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 25);

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {person.publicId}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {person.fullName}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/people/${person.publicId}/edit`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Edit profile
            </Link>
            <Link
              href={`/notes/new?personId=${person.publicId}`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              New note for this person
            </Link>
            <Link
              href="/people"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Back to people
            </Link>
          </div>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <nav className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-5">
            <a
              href="#overview"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Overview
            </a>
            <a
              href="#notes"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Notes
            </a>
            <a
              href="#interactions"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Interactions
            </a>
            <a
              href="#timeline"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Timeline
            </a>
            <a
              href="#connections"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              Connections
            </a>
          </nav>

          <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-6">
            <form
              action={async () => {
                "use server";
                await updatePersonStatusAction(person.publicId, "ACTIVE");
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                Mark active
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await updatePersonStatusAction(person.publicId, "ARCHIVED");
              }}
            >
              <ConfirmSubmitButton
                type="submit"
                confirmMessage="Archive this person profile?"
                className="inline-flex items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                Archive
              </ConfirmSubmitButton>
            </form>
            <form
              action={async () => {
                "use server";
                await deletePersonAction(person.publicId);
              }}
            >
              <ConfirmSubmitButton
                type="submit"
                confirmMessage="Delete this person permanently?"
                className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>

          <dl id="overview" className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Relationship
              </dt>
              <dd className="mt-2 text-sm text-slate-800">
                {person.relationshipToMe?.type ?? "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Status
              </dt>
              <dd className="mt-2 text-sm text-slate-800">{person.status}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Circles
              </dt>
              <dd className="mt-2 text-sm text-slate-800">
                {person.circles.join(", ") || "None"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Tags
              </dt>
              <dd className="mt-2 text-sm text-slate-800">
                {person.tags.join(", ") || "None"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              How you met
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {person.howMet || "No details added yet."}
            </p>
          </div>

          <section id="notes" className="mt-8 border-t border-slate-200 pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
              <Link
                href={`/notes/new?personId=${person.publicId}`}
                className="text-sm font-medium text-slate-700 hover:text-slate-950"
              >
                Add note
              </Link>
            </div>
            {notes.length === 0 ? (
              <p className="text-sm text-slate-600">No notes linked yet.</p>
            ) : (
              <ul className="space-y-2">
                {notes.map((note) => (
                  <li key={note.publicId} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Link href={`/notes/${note.publicId}`} className="font-medium text-slate-900 hover:underline">
                      {note.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="interactions" className="mt-8 border-t border-slate-200 pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Interactions</h2>
              <Link
                href={`/interactions/new?personId=${person.publicId}`}
                className="text-sm font-medium text-slate-700 hover:text-slate-950"
              >
                Log interaction
              </Link>
            </div>
            {interactions.length === 0 ? (
              <p className="text-sm text-slate-600">No interactions linked yet.</p>
            ) : (
              <ul className="space-y-2">
                {interactions.map((interaction) => (
                  <li
                    key={interaction.publicId}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <Link
                      href={`/interactions/${interaction.publicId}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {interaction.summary || interaction.type}
                    </Link>
                    <p className="text-xs text-slate-600">
                      {interaction.type} • {new Date(interaction.date).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="timeline" className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Timeline</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-slate-600">No timeline activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {timeline.map((item) => (
                  <li key={`${item.kind}-${item.id}`} className="rounded-xl border border-slate-200 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {item.kind} • {item.date.toLocaleDateString()}
                    </p>
                    <Link href={item.href} className="mt-1 block font-medium text-slate-900 hover:underline">
                      {item.title}
                    </Link>
                    {item.subtitle ? <p className="text-xs text-slate-600">{item.subtitle}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="connections" className="mt-8 border-t border-slate-200 pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Connections</h2>
              <Link href="/connections" className="text-sm font-medium text-slate-700 hover:text-slate-950">
                Open graph
              </Link>
            </div>
            {relationships.length === 0 ? (
              <p className="text-sm text-slate-600">No relationship links yet.</p>
            ) : (
              <ul className="space-y-2">
                {relationships.map((relationship) => {
                  const left = String(relationship.personAId);
                  const right = String(relationship.personBId);
                  const otherPersonId = left === personObjectId ? right : left;
                  const otherPerson = relatedById.get(otherPersonId);

                  return (
                    <li
                      key={relationship.publicId}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <p className="font-medium text-slate-900">{relationship.relationshipType}</p>
                      <p className="text-xs text-slate-600">
                        With: {otherPerson ? otherPerson.fullName : "Unknown person"}
                      </p>
                      <Link
                        href={`/relationships/${relationship.publicId}`}
                        className="mt-1 inline-block text-xs font-medium text-slate-700 hover:text-slate-950"
                      >
                        View relationship
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}