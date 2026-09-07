import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateReminderAction } from "@/actions/reminders";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { listPeople } from "@/lib/dal/people";
import { getReminderByPublicId } from "@/lib/dal/reminders";

type EditReminderPageProps = {
  params: Promise<{ reminderId: string }>;
};

export default async function EditReminderPage({ params }: EditReminderPageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const { reminderId } = await params;
  const [reminder, people] = await Promise.all([getReminderByPublicId(reminderId), listPeople()]);

  if (!reminder) {
    notFound();
  }

  const associatedPeople = people
    .filter((person) => (reminder.personIds ?? []).includes(String(person._id)))
    .map((person) => person.publicId)
    .join(", ");

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Edit reminder</h1>
          <Link href={`/reminders/${reminder.publicId}`} className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800">Back</Link>
        </header>
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <form action={async (formData) => {"use server"; await updateReminderAction(reminder.publicId, formData);}} className="space-y-4">
            <input name="title" defaultValue={reminder.title} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <textarea name="description" rows={4} defaultValue={reminder.description ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="date" type="date" defaultValue={new Date(reminder.date).toISOString().slice(0, 10)} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="time" defaultValue={reminder.time ?? "00:00"} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <select name="recurrenceType" defaultValue={reminder.recurrenceType} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="ONCE">Once</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            <select name="recurrenceBehavior" defaultValue={reminder.recurrenceBehavior ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">None</option>
              <option value="SKIP">Skip</option>
              <option value="PREVIOUS_VALID_DAY">Previous valid day</option>
              <option value="NEXT_VALID_DAY">Next valid day</option>
            </select>
            <input name="associatedPeople" defaultValue={associatedPeople} placeholder="Associated people IDs" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="noteId" defaultValue={reminder.noteId ?? ""} placeholder="Related note public ID" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="eventId" defaultValue={reminder.eventId ?? ""} placeholder="Related event public ID" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input name="enabled" type="checkbox" defaultChecked={reminder.enabled} /> Enabled</label>
            <button type="submit" className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800">Save reminder</button>
          </form>
        </section>
      </div>
    </main>
  );
}
