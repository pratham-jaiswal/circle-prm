import Link from "next/link";
import { redirect } from "next/navigation";

import { createRelationshipAction } from "@/actions/relationships";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";

export default async function NewRelationshipPage() {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
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
              New relationship
            </h1>
          </div>
          <Link
            href="/relationships"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Back
          </Link>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <form action={createRelationshipAction} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="personAPublicId" className="text-sm font-medium text-slate-800">
                  Person A public ID
                </label>
                <input
                  id="personAPublicId"
                  name="personAPublicId"
                  required
                  placeholder="PER_A7K29X"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="personBPublicId" className="text-sm font-medium text-slate-800">
                  Person B public ID
                </label>
                <input
                  id="personBPublicId"
                  name="personBPublicId"
                  required
                  placeholder="PER_B1K82M"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="relationshipType" className="text-sm font-medium text-slate-800">
                Relationship type
              </label>
              <input
                id="relationshipType"
                name="relationshipType"
                required
                placeholder="College Friend"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-slate-800">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={5}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none ring-slate-300 transition focus:ring"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Save relationship
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
