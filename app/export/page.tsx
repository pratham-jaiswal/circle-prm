import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";

export default async function ExportPage() {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Circle PRM
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Export center
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Dashboard
            </Link>
            <SignOutButton />
          </div>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Full export</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Download your current user-scoped backup payload as JSON or as a ZIP bundle.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href="/api/export/full"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Download export JSON
            </a>
            <a
              href="/api/export/full/zip"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Download export ZIP
            </a>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Entity exports</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Export selected collections for focused sharing, auditing, or targeted imports.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href="/api/export/people"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Download people JSON
            </a>
            <a
              href="/api/export/notes"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Download notes JSON
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
