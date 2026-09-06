import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateInteractionAction } from "@/actions/interactions";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { getInteractionByPublicId } from "@/lib/dal/interactions";
import { listPeople } from "@/lib/dal/people";

type EditInteractionPageProps = {
  params: Promise<{ interactionId: string }>;
};

export default async function EditInteractionPage({ params }: EditInteractionPageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const { interactionId } = await params;
  const [interaction, people] = await Promise.all([
    getInteractionByPublicId(interactionId),
    listPeople(),
  ]);

  if (!interaction) {
    notFound();
  }

  const associatedPeople = people
    .filter((person) => (interaction.personIds ?? []).includes(String(person._id)))
    .map((person) => person.publicId)
    .join(", ");

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Edit interaction</h1>
          <Link href={`/interactions/${interaction.publicId}`} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800">Back</Link>
        </header>
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <form action={async (formData) => {"use server"; await updateInteractionAction(interaction.publicId, formData);}} className="space-y-4">
            <input name="type" defaultValue={interaction.type} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="date" type="date" defaultValue={new Date(interaction.date).toISOString().slice(0, 10)} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="time" defaultValue={interaction.time ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="durationMinutes" type="number" defaultValue={interaction.durationMinutes ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="associatedPeople" defaultValue={associatedPeople} placeholder="Associated people IDs" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="summary" defaultValue={interaction.summary ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <textarea name="detailedNotes" rows={5} defaultValue={interaction.detailedNotes ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="tags" defaultValue={(interaction.tags ?? []).join(", ")} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <button type="submit" className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800">Save interaction</button>
          </form>
        </section>
      </div>
    </main>
  );
}
