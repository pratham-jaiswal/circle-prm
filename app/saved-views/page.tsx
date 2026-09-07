import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { SavedViewsManager } from "@/components/saved-views/saved-views-manager";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { listSavedViews } from "@/lib/dal/saved-views";

export default async function SavedViewsPage() {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const savedViews = await listSavedViews();

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Circle PRM</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Saved views</h1>
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

        <SavedViewsManager
          initialViews={savedViews.map((item) => ({
            publicId: item.publicId,
            name: item.name,
            filters:
              item.filters && typeof item.filters === "object"
                ? (item.filters as Record<string, unknown>)
                : {},
          }))}
        />
      </div>
    </main>
  );
}
