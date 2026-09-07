import Link from "next/link";
import { redirect } from "next/navigation";

import { createInteractionAction } from "@/actions/interactions";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { getPersonByPublicId } from "@/lib/dal/people";

type NewInteractionPageProps = {
  searchParams: Promise<{ personId?: string }>;
};

export default async function NewInteractionPage({ searchParams }: NewInteractionPageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const { personId } = await searchParams;
  let initialAssociatedPeople = "";

  if (personId) {
    const person = await getPersonByPublicId(personId);
    if (person) {
      initialAssociatedPeople = person.publicId;
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Circle PRM
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              New interaction
            </h1>
          </div>
          <Link
            href="/interactions"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Back
          </Link>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <form action={createInteractionAction} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium text-slate-800">
                  Type
                </label>
                <input
                  id="type"
                  name="type"
                  required
                  placeholder="Call"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium text-slate-800">
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="time" className="text-sm font-medium text-slate-800">
                  Time
                </label>
                <input
                  id="time"
                  name="time"
                  type="time"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="durationMinutes" className="text-sm font-medium text-slate-800">
                  Duration (minutes)
                </label>
                <input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="summary" className="text-sm font-medium text-slate-800">
                Summary
              </label>
              <input
                id="summary"
                name="summary"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                placeholder="Discussed job update"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="detailedNotes" className="text-sm font-medium text-slate-800">
                Detailed notes
              </label>
              <textarea
                id="detailedNotes"
                name="detailedNotes"
                rows={6}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none ring-slate-300 transition focus:ring"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="associatedPeople" className="text-sm font-medium text-slate-800">
                  Associated people (public IDs)
                </label>
                <input
                  id="associatedPeople"
                  name="associatedPeople"
                  placeholder="PER_A7K29X"
                  defaultValue={initialAssociatedPeople}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="tags" className="text-sm font-medium text-slate-800">
                  Tags
                </label>
                <input
                  id="tags"
                  name="tags"
                  placeholder="call, followup"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                Save interaction
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
