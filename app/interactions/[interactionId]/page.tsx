import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteInteractionAction } from "@/actions/interactions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { getInteractionByPublicId } from "@/lib/dal/interactions";

type InteractionPageProps = {
  params: Promise<{ interactionId: string }>;
};

export default async function InteractionPage({ params }: InteractionPageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const { interactionId } = await params;
  const interaction = await getInteractionByPublicId(interactionId);

  if (!interaction) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {interaction.publicId}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {interaction.type}
            </h1>
          </div>
          <Link
            href="/interactions"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Back
          </Link>
          <Link
            href={`/interactions/${interaction.publicId}/edit`}
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
              await deleteInteractionAction(interaction.publicId);
            }}
          >
            <ConfirmSubmitButton
              type="submit"
              confirmMessage="Delete this interaction permanently?"
              className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Delete interaction
            </ConfirmSubmitButton>
          </form>

          <p className="text-sm text-slate-600">
            {new Date(interaction.date).toLocaleDateString()} {interaction.time ? `• ${interaction.time}` : ""}
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-800">
            {interaction.summary || "No summary"}
          </p>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">
            {interaction.detailedNotes || "No detailed notes"}
          </pre>
        </section>
      </div>
    </main>
  );
}