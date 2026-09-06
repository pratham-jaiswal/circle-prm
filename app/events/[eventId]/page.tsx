import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteEventAction } from "@/actions/events";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { getEventByPublicId } from "@/lib/dal/events";

type EventPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const { eventId } = await params;
  const event = await getEventByPublicId(eventId);

  if (!event) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {event.publicId}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {event.title}
            </h1>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Back
          </Link>
          <Link
            href={`/events/${event.publicId}/edit`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Edit
          </Link>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <form
            className="mb-6"
            action={async () => {
              "use server";
              await deleteEventAction(event.publicId);
            }}
          >
            <ConfirmSubmitButton
              type="submit"
              confirmMessage="Delete this event permanently?"
              className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Delete event
            </ConfirmSubmitButton>
          </form>

          <p className="text-sm text-slate-600">{new Date(event.date).toLocaleDateString()}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-800">
            {event.description || "No description"}
          </p>
        </section>
      </div>
    </main>
  );
}
