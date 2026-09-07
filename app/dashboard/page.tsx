import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { listEvents } from "@/lib/dal/events";
import { listInteractions } from "@/lib/dal/interactions";
import { listNotes } from "@/lib/dal/notes";
import { listPeople } from "@/lib/dal/people";
import { listRelationships } from "@/lib/dal/relationships";
import { listReminders } from "@/lib/dal/reminders";
import { listSavedViews } from "@/lib/dal/saved-views";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(left: Date, right: Date) {
  return Math.floor((left.getTime() - right.getTime()) / MS_PER_DAY);
}

function getNextBirthday(month: number, day: number) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const candidate = new Date(thisYear, month - 1, day);
  if (candidate >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    return candidate;
  }
  return new Date(thisYear + 1, month - 1, day);
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const [people, notes, interactions, reminders, relationships, events, savedViews] =
    await Promise.all([
      listPeople(),
      listNotes(),
      listInteractions(),
      listReminders(),
      listRelationships(),
      listEvents(),
      listSavedViews(),
    ]);

  const upcomingReminderCount = reminders.filter((item) => item.enabled).length;
  const now = new Date();

  const upcomingReminders = reminders
    .filter((item) => item.enabled)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const upcomingBirthdays = people
    .filter((person) => person.dateOfBirth?.month && person.dateOfBirth?.day)
    .map((person) => {
      const nextBirthday = getNextBirthday(
        Number(person.dateOfBirth?.month),
        Number(person.dateOfBirth?.day),
      );
      return {
        person,
        nextBirthday,
        daysUntil: daysBetween(nextBirthday, new Date(now.getFullYear(), now.getMonth(), now.getDate())),
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  const latestInteractionByPerson = new Map<string, Date>();
  for (const interaction of interactions) {
    for (const personId of interaction.personIds ?? []) {
      const current = latestInteractionByPerson.get(personId);
      const candidate = new Date(interaction.date);
      if (!current || candidate > current) {
        latestInteractionByPerson.set(personId, candidate);
      }
    }
  }

  const peopleToReachOut = people
    .map((person) => {
      const lastInteraction = latestInteractionByPerson.get(String(person._id));
      const daysSince = lastInteraction ? daysBetween(now, lastInteraction) : 9999;
      return {
        person,
        lastInteraction,
        daysSince,
        target: 30,
      };
    })
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 5);

  const recentNotes = notes.slice(0, 5);
  const recentInteractions = interactions.slice(0, 5);

  return (
    <main className="theme-aware relative min-h-screen overflow-hidden px-6 py-8 sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.10),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0b1220_100%)]" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900/70">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Circle PRM
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              Dashboard
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Signed in as {session.user.email}
            </div>
            <SignOutButton />
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="flex flex-col justify-between rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-10 dark:border-slate-700 dark:bg-slate-900">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                  Your workspace shows upcoming commitments, relationship rhythm, and recent knowledge so you can follow through consistently.
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <Link
                href="/people"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                People
              </Link>
              <Link
                href="/notes"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                Notes
              </Link>
              <Link
                href="/reminders/new"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                Add Reminder
              </Link>
              <Link
                href="/interactions/new"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                Log Interaction
              </Link>
            </div>
          </div>

          <div className="grid gap-6">
            <section id="phase-1" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Dashboard intelligence</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">People: {people.length}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Notes: {notes.length}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Interactions: {interactions.length}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Events: {events.length}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Reminders on: {upcomingReminderCount}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Relationships: {relationships.length}</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Saved views: {savedViews.length}</div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Upcoming reminders</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {upcomingReminders.map((reminder) => (
                  <li key={String(reminder._id)}>
                    <Link href={`/reminders/${reminder.publicId}`} className="hover:text-slate-950 dark:hover:text-white">
                      {reminder.title} • {new Date(reminder.date).toLocaleDateString()} {reminder.time}
                    </Link>
                  </li>
                ))}
                {upcomingReminders.length === 0 ? <li>No active reminders.</li> : null}
              </ul>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Upcoming birthdays</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {upcomingBirthdays.map((entry) => (
                  <li key={String(entry.person._id)}>
                    <Link href={`/people/${entry.person.publicId}`} className="hover:text-slate-950 dark:hover:text-white">
                      {entry.person.fullName} • in {entry.daysUntil} day{entry.daysUntil === 1 ? "" : "s"}
                    </Link>
                  </li>
                ))}
                {upcomingBirthdays.length === 0 ? <li>No birthdays available yet.</li> : null}
              </ul>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">People to reach out to</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {peopleToReachOut.map((entry) => (
                  <li key={String(entry.person._id)}>
                    <Link href={`/people/${entry.person.publicId}`} className="hover:text-slate-950 dark:hover:text-white">
                      {entry.person.fullName} • {entry.lastInteraction ? `${entry.daysSince} days since contact` : "No interaction history"}
                    </Link>
                  </li>
                ))}
                {peopleToReachOut.length === 0 ? <li>No interaction history available yet.</li> : null}
              </ul>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Recent notes</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {recentNotes.map((note) => (
                  <li key={String(note._id)}>
                    <Link href={`/notes/${note.publicId}`} className="hover:text-slate-950 dark:hover:text-white">
                      {note.title}
                    </Link>
                  </li>
                ))}
                {recentNotes.length === 0 ? <li>No notes yet.</li> : null}
              </ul>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Recent interactions</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {recentInteractions.map((interaction) => (
                  <li key={String(interaction._id)}>
                    <Link href={`/interactions/${interaction.publicId}`} className="hover:text-slate-950 dark:hover:text-white">
                      {interaction.type} • {new Date(interaction.date).toLocaleDateString()}
                    </Link>
                  </li>
                ))}
                {recentInteractions.length === 0 ? <li>No interactions logged yet.</li> : null}
              </ul>
            </section>

            <section
              id="shortcuts"
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900"
            >
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Workspace shortcuts
              </h3>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <p>Jump to the areas you use most often.</p>
                <p>Use Ctrl/Cmd + K to quickly search from any signed-in page.</p>
              </div>

              <div className="mt-5 grid gap-2 text-xs text-slate-700 sm:grid-cols-2 dark:text-slate-200">
                <Link href="/interactions" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">Interactions</Link>
                <Link href="/events" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">Events</Link>
                <Link href="/reminders" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">Reminders</Link>
                <Link href="/relationships" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">Relationships</Link>
                <Link href="/connections" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">Connections</Link>
                <Link href="/saved-views" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">Saved views</Link>
                <Link href="/settings" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">Settings</Link>
                <Link href="/import" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">Import</Link>
                <Link href="/export" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">Export</Link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
