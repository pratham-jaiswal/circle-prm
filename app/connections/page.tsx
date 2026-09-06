import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ConnectionsGraph } from "@/components/connections/connections-graph";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { listPeople } from "@/lib/dal/people";
import { listRelationships } from "@/lib/dal/relationships";

export default async function ConnectionsPage() {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const [people, relationships] = await Promise.all([listPeople(), listRelationships()]);

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Circle PRM
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Connections
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/relationships"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Manage relationships
            </Link>
            <SignOutButton />
          </div>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="mb-5 text-sm text-slate-600">
            Explore your network by filtering relationship types, searching people, and focusing by connection depth.
          </p>
          <ConnectionsGraph
            people={people.map((person) => ({
              id: String(person._id),
              publicId: person.publicId,
              fullName: person.fullName,
            }))}
            relationships={relationships.map((relationship) => ({
              id: String(relationship._id),
              publicId: relationship.publicId,
              personAId: String(relationship.personAId),
              personBId: String(relationship.personBId),
              relationshipType: relationship.relationshipType,
            }))}
          />
        </section>
      </div>
    </main>
  );
}