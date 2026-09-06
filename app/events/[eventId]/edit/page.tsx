import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateEventAction } from "@/actions/events";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { getEventByPublicId } from "@/lib/dal/events";
import { listPeople } from "@/lib/dal/people";

type EditEventPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const { eventId } = await params;
  const [event, people] = await Promise.all([getEventByPublicId(eventId), listPeople()]);

  if (!event) {
    notFound();
  }

  const associatedPeople = people
    .filter((person) => (event.personIds ?? []).includes(String(person._id)))
    .map((person) => person.publicId)
    .join(", ");

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Edit event</h1>
          <Link href={`/events/${event.publicId}`} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800">Back</Link>
        </header>
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <form action={async (formData) => {"use server"; await updateEventAction(event.publicId, formData);}} className="space-y-4">
            <input name="title" defaultValue={event.title} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="date" type="date" defaultValue={new Date(event.date).toISOString().slice(0, 10)} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="associatedPeople" defaultValue={associatedPeople} placeholder="Associated people IDs" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <textarea name="description" rows={4} defaultValue={event.description ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="tags" defaultValue={(event.tags ?? []).join(", ")} placeholder="tags" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <button type="submit" className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800">Save event</button>
          </form>
        </section>
      </div>
    </main>
  );
}
