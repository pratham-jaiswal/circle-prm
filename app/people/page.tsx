import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ActionNotice } from "@/components/ui/action-notice";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { listPeopleWithFilters } from "@/lib/dal/people";

type PeoplePageProps = {
  searchParams: Promise<{
    notice?: string;
    q?: string;
    circle?: string;
    relationship?: string;
    location?: string;
    status?: string;
    tag?: string;
    interest?: string;
    ageMin?: string;
    ageMax?: string;
    birthdayMonth?: string;
    birthdayDay?: string;
    sort?:
      | "name_asc"
      | "name_desc"
      | "age_asc"
      | "age_desc"
      | "birthday_upcoming"
      | "last_interaction_recent"
      | "recently_added"
      | "recently_updated";
  }>;
};

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const params = await searchParams;

  const people = await listPeopleWithFilters({
    query: params.q,
    circle: params.circle,
    relationship: params.relationship,
    location: params.location,
    status: params.status,
    tag: params.tag,
    interest: params.interest,
    ageMin: params.ageMin,
    ageMax: params.ageMax,
    birthdayMonth: params.birthdayMonth,
    birthdayDay: params.birthdayDay,
    sort: params.sort,
  });

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Circle PRM
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              People
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Dashboard
            </Link>
            <Link
              href="/people/new"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Add person
            </Link>
            <SignOutButton />
          </div>
        </header>

        <ActionNotice notice={params.notice} />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <form className="grid gap-3 md:grid-cols-4">
            <input name="q" defaultValue={params.q ?? ""} placeholder="Search name, alias, tag..." className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            <input name="circle" defaultValue={params.circle ?? ""} placeholder="Circle" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            <input name="relationship" defaultValue={params.relationship ?? ""} placeholder="Relationship" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            <input name="location" defaultValue={params.location ?? ""} placeholder="Location" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            <input name="tag" defaultValue={params.tag ?? ""} placeholder="Tag" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            <input name="interest" defaultValue={params.interest ?? ""} placeholder="Interest" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            <input name="ageMin" defaultValue={params.ageMin ?? ""} placeholder="Min age" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            <input name="ageMax" defaultValue={params.ageMax ?? ""} placeholder="Max age" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            <input name="birthdayMonth" defaultValue={params.birthdayMonth ?? ""} placeholder="Birthday month (1-12)" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            <input name="birthdayDay" defaultValue={params.birthdayDay ?? ""} placeholder="Birthday day (1-31)" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            <select name="status" defaultValue={params.status ?? ""} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
              <option value="">All statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="LOST_CONTACT">LOST_CONTACT</option>
              <option value="ARCHIVED">ARCHIVED</option>
              <option value="DECEASED">DECEASED</option>
            </select>
            <select name="sort" defaultValue={params.sort ?? "name_asc"} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="age_asc">Age: Younger first</option>
              <option value="age_desc">Age: Older first</option>
              <option value="birthday_upcoming">Birthday: Upcoming</option>
              <option value="last_interaction_recent">Last interaction: Recent</option>
              <option value="recently_added">Recently added</option>
              <option value="recently_updated">Recently updated</option>
            </select>
            <div className="md:col-span-4 flex flex-wrap gap-2">
              <button type="submit" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800">Apply filters</button>
              <Link href="/people" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800">Reset</Link>
            </div>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-sm text-slate-600">
            {people.length} {people.length === 1 ? "person" : "people"} in your
            private workspace.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {people.map((person) => (
              <Link
                key={String(person._id)}
                href={`/people/${person.publicId}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <p className="text-base font-semibold text-slate-900">{person.fullName}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {person.publicId}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {(person.tags ?? []).slice(0, 3).join(" • ") ||
                    "No tags yet"}
                </p>
              </Link>
            ))}
          </div>

          {people.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No people added yet. Start with your first profile.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
