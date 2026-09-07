import Link from "next/link";
import { redirect } from "next/navigation";

import { updateSettingsAction } from "@/actions/settings";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeSelect } from "@/components/theme/theme-select";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { getUserSettings } from "@/lib/dal/settings";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const settings = await getUserSettings();
  const reminderOffsets = Array.isArray(settings?.reminderSettings?.defaultOffsetsDays)
    ? settings.reminderSettings.defaultOffsetsDays.join(",")
    : "0,1,2,7";
  const defaultConflictPolicy =
    settings?.importPreferences?.defaultConflictPolicy === "skip" ||
    settings?.importPreferences?.defaultConflictPolicy === "duplicate"
      ? settings.importPreferences.defaultConflictPolicy
      : "overwrite";
  const autoCreateFromUnresolved =
    settings?.importPreferences?.autoCreateFromUnresolved === true;

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Circle PRM
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Settings
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
          <form action={updateSettingsAction} className="space-y-5">
            <div className="space-y-3 border-b border-slate-200 pb-5">
              <h2 className="text-lg font-semibold text-slate-900">Appearance</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="theme" className="text-sm font-medium text-slate-800">
                    Theme
                  </label>
                  <ThemeSelect initialTheme={settings?.theme ?? "system"} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="timezone" className="text-sm font-medium text-slate-800">
                    Timezone
                  </label>
                  <input
                    id="timezone"
                    name="timezone"
                    defaultValue={settings?.timezone ?? "UTC"}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-b border-slate-200 pb-5">
              <h2 className="text-lg font-semibold text-slate-900">Reminder Preferences</h2>
              <div className="space-y-2">
                <label htmlFor="invalidDateBehavior" className="text-sm font-medium text-slate-800">
                  Invalid date behavior
                </label>
                <select
                  id="invalidDateBehavior"
                  name="invalidDateBehavior"
                  defaultValue={settings?.invalidDateBehavior ?? "SKIP"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                >
                  <option value="SKIP">Skip</option>
                  <option value="PREVIOUS_VALID_DAY">Previous valid day</option>
                  <option value="NEXT_VALID_DAY">Next valid day</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="defaultReminderOffsetsDays" className="text-sm font-medium text-slate-800">
                  Default reminder offsets (days, comma separated)
                </label>
                <input
                  id="defaultReminderOffsetsDays"
                  name="defaultReminderOffsetsDays"
                  defaultValue={reminderOffsets}
                  placeholder="0,1,2,7"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
            </div>

            <div className="space-y-3 border-b border-slate-200 pb-5">
              <h2 className="text-lg font-semibold text-slate-900">Import / Export</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="importDefaultConflictPolicy" className="text-sm font-medium text-slate-800">
                    Default import conflict policy
                  </label>
                  <select
                    id="importDefaultConflictPolicy"
                    name="importDefaultConflictPolicy"
                    defaultValue={defaultConflictPolicy}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                  >
                    <option value="overwrite">Overwrite existing</option>
                    <option value="skip">Skip incoming</option>
                    <option value="duplicate">Create duplicate</option>
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="importAutoCreateFromUnresolved"
                    defaultChecked={autoCreateFromUnresolved}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Prefer creating new people for unresolved references
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/import"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                >
                  Open import center
                </Link>
                <Link
                  href="/export"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                >
                  Open export center
                </Link>
              </div>
            </div>

            <div className="space-y-3 border-b border-slate-200 pb-5">
              <h2 className="text-lg font-semibold text-slate-900">Data</h2>
              <p className="text-sm text-slate-600">
                Your data is isolated per authenticated account and scoped server-side.
              </p>
            </div>

            <div className="space-y-3 border-b border-slate-200 pb-5">
              <h2 className="text-lg font-semibold text-slate-900">Account</h2>
              <p className="text-sm text-slate-600">
                You are signed in with an allowlisted account.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Danger Zone</h2>
              <p className="text-sm text-slate-600">
                Export your backup before performing destructive operations.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Save settings
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
