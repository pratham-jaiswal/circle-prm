import { redirect } from "next/navigation";

import Link from "next/link";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";

export default async function Home() {
  const session = await getSession();

  if (session?.user?.email && isEmailAllowed(session.user.email)) {
    redirect("/dashboard");
  }

  return (
    <main className="theme-aware relative min-h-screen overflow-hidden px-6 py-8 sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.10),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0b1220_100%)]" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <section className="grid w-full gap-6 rounded-[2rem] border border-slate-200 bg-white/85 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10 lg:grid-cols-[1.25fr_0.95fr] dark:border-slate-700 dark:bg-slate-900/80">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Circle PRM
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-slate-100">
              Personal Relationship Manager for people who value follow-through.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
              Capture context, manage reminders, and keep relationships healthy with a clear private workspace.
            </p>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Private access only for now.
            </div>
            <div className="pt-2">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                Go to login
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Built for your core workflow
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                People, notes, reminders, interactions, and relationship mapping in one place.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Private-first by design
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                Every record is user-scoped and access-controlled on the server.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Import and export ready
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                Bring in existing data safely and export your workspace whenever needed.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
