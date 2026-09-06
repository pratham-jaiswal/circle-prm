import Link from "next/link";
import { redirect } from "next/navigation";

import { createPersonAction } from "@/actions/people";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";

export default async function NewPersonPage() {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Circle PRM
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Add person
            </h1>
          </div>
          <Link
            href="/people"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Back to people
          </Link>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <form action={createPersonAction} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-slate-800">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="relationshipType" className="text-sm font-medium text-slate-800">
                Relationship to me
              </label>
              <input
                id="relationshipType"
                name="relationshipType"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                placeholder="Friend"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="aliases" className="text-sm font-medium text-slate-800">
                  Aliases
                </label>
                <input
                  id="aliases"
                  name="aliases"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                  placeholder="Johnny, JD"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="circles" className="text-sm font-medium text-slate-800">
                  Circles
                </label>
                <input
                  id="circles"
                  name="circles"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                  placeholder="Friend, Close"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="interests" className="text-sm font-medium text-slate-800">
                  Interests
                </label>
                <input
                  id="interests"
                  name="interests"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                  placeholder="Gaming, Anime"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="tags" className="text-sm font-medium text-slate-800">
                  Tags
                </label>
                <input
                  id="tags"
                  name="tags"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                  placeholder="college, important"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="howMet" className="text-sm font-medium text-slate-800">
                How you met
              </label>
              <textarea
                id="howMet"
                name="howMet"
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                placeholder="Met through college in 2019."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                Save person
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
