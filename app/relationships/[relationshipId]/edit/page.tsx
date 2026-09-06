import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateRelationshipAction } from "@/actions/relationships";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { listPeople } from "@/lib/dal/people";
import { getRelationshipByPublicId } from "@/lib/dal/relationships";

type EditRelationshipPageProps = {
  params: Promise<{ relationshipId: string }>;
};

export default async function EditRelationshipPage({ params }: EditRelationshipPageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const { relationshipId } = await params;
  const [relationship, people] = await Promise.all([
    getRelationshipByPublicId(relationshipId),
    listPeople(),
  ]);

  if (!relationship) {
    notFound();
  }

  const personA = people.find((person) => String(person._id) === String(relationship.personAId));
  const personB = people.find((person) => String(person._id) === String(relationship.personBId));

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Edit relationship</h1>
          <Link href={`/relationships/${relationship.publicId}`} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800">Back</Link>
        </header>
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <form action={async (formData) => {"use server"; await updateRelationshipAction(relationship.publicId, formData);}} className="space-y-4">
            <input name="personAPublicId" defaultValue={personA?.publicId ?? ""} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="personBPublicId" defaultValue={personB?.publicId ?? ""} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="relationshipType" defaultValue={relationship.relationshipType} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input name="customRelationship" defaultValue={relationship.customRelationship ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <textarea name="notes" rows={4} defaultValue={relationship.notes ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <button type="submit" className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800">Save relationship</button>
          </form>
        </section>
      </div>
    </main>
  );
}
