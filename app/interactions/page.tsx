import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ActionNotice } from "@/components/ui/action-notice";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { listInteractions } from "@/lib/dal/interactions";

type InteractionsPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function InteractionsPage({ searchParams }: InteractionsPageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const { notice } = await searchParams;

  const interactions = await listInteractions();

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Circle PRM
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Interactions
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
              href="/interactions/new"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              New interaction
            </Link>
            <SignOutButton />
          </div>
        </header>

        <ActionNotice notice={notice} />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-sm text-slate-600">
            {interactions.length} interaction
            {interactions.length === 1 ? "" : "s"} recorded.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {interactions.map((interaction) => (
              <Link
                key={String(interaction._id)}
                href={`/interactions/${interaction.publicId}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <p className="text-base font-semibold text-slate-900">
                  {interaction.type}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {interaction.publicId}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {new Date(interaction.date).toLocaleDateString()} • {interaction.summary || "No summary"}
                </p>
              </Link>
            ))}
          </div>

          {interactions.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No interactions logged yet.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
