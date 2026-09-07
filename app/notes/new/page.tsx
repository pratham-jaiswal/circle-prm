import Link from "next/link";
import { redirect } from "next/navigation";

import { NoteEditorForm } from "@/components/notes/note-editor-form";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { getPersonByPublicId } from "@/lib/dal/people";

type NewNotePageProps = {
  searchParams: Promise<{ personId?: string }>;
};

export default async function NewNotePage({ searchParams }: NewNotePageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const { personId } = await searchParams;
  let initialAssociatedPeople: string[] = [];

  if (personId) {
    const person = await getPersonByPublicId(personId);
    if (person) {
      initialAssociatedPeople = [person.publicId];
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Circle PRM
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              New note
            </h1>
          </div>
          <Link
            href="/notes"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Back to notes
          </Link>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <NoteEditorForm mode="create" initialAssociatedPeople={initialAssociatedPeople} />
        </section>
      </div>
    </main>
  );
}
