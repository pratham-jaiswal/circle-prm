import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteReminderAction, toggleReminderEnabledAction } from "@/actions/reminders";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { getReminderByPublicId } from "@/lib/dal/reminders";

type ReminderPageProps = {
  params: Promise<{ reminderId: string }>;
};

export default async function ReminderPage({ params }: ReminderPageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const { reminderId } = await params;
  const reminder = await getReminderByPublicId(reminderId);

  if (!reminder) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {reminder.publicId}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {reminder.title}
            </h1>
          </div>
          <Link
            href="/reminders"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Back
          </Link>
          <Link
            href={`/reminders/${reminder.publicId}/edit`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Edit
          </Link>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <form
              action={async () => {
                "use server";
                await toggleReminderEnabledAction(reminder.publicId, !reminder.enabled);
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                {reminder.enabled ? "Disable" : "Enable"}
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await deleteReminderAction(reminder.publicId);
              }}
            >
              <ConfirmSubmitButton
                type="submit"
                confirmMessage="Delete this reminder permanently?"
                className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Delete reminder
              </ConfirmSubmitButton>
            </form>
          </div>

          <p className="text-sm text-slate-600">
            {new Date(reminder.date).toLocaleDateString()} • {reminder.time}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Recurrence: {reminder.recurrenceType}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-800">
            {reminder.description || "No description"}
          </p>
        </section>
      </div>
    </main>
  );
}