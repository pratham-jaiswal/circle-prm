import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updatePersonAction } from "@/actions/people";
import { ActionNotice } from "@/components/ui/action-notice";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";
import { getPersonByPublicId } from "@/lib/dal/people";

type EditPersonPageProps = {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ notice?: string }>;
};

export default async function EditPersonPage({ params, searchParams }: EditPersonPageProps) {
  const session = await getSession();

  if (!session?.user?.email || !isEmailAllowed(session.user.email)) {
    redirect("/sign-in");
  }

  const { personId } = await params;
  const { notice } = await searchParams;

  const person = await getPersonByPublicId(personId);

  if (!person) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {person.publicId}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Edit person
            </h1>
          </div>
          <Link
            href={`/people/${person.publicId}`}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Back to profile
          </Link>
        </header>

        <ActionNotice notice={notice} />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <form
            action={async (formData) => {
              "use server";
              await updatePersonAction(person.publicId, formData);
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-slate-800">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                defaultValue={person.fullName}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="relationshipType" className="text-sm font-medium text-slate-800">
                  Relationship
                </label>
                <input
                  id="relationshipType"
                  name="relationshipType"
                  defaultValue={person.relationshipToMe?.type ?? ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="customRelationship" className="text-sm font-medium text-slate-800">
                  Custom relationship
                </label>
                <input
                  id="customRelationship"
                  name="customRelationship"
                  defaultValue={person.relationshipToMe?.customRelationship ?? ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="aliases" className="text-sm font-medium text-slate-800">
                  Aliases
                </label>
                <input
                  id="aliases"
                  name="aliases"
                  defaultValue={(person.aliases ?? []).join(", ")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="circles" className="text-sm font-medium text-slate-800">
                  Circles
                </label>
                <input
                  id="circles"
                  name="circles"
                  defaultValue={(person.circles ?? []).join(", ")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="birthMonth" className="text-sm font-medium text-slate-800">
                  Birth month
                </label>
                <input
                  id="birthMonth"
                  name="birthMonth"
                  type="number"
                  min={1}
                  max={12}
                  defaultValue={person.dateOfBirth?.month ?? ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="birthDay" className="text-sm font-medium text-slate-800">
                  Birth day
                </label>
                <input
                  id="birthDay"
                  name="birthDay"
                  type="number"
                  min={1}
                  max={31}
                  defaultValue={person.dateOfBirth?.day ?? ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="birthYear" className="text-sm font-medium text-slate-800">
                  Birth year (optional)
                </label>
                <input
                  id="birthYear"
                  name="birthYear"
                  type="number"
                  min={1}
                  max={9999}
                  defaultValue={person.dateOfBirth?.year ?? ""}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="livesInDisplay" className="text-sm font-medium text-slate-800">
                  Lives in
                </label>
                <input id="livesInDisplay" name="livesInDisplay" defaultValue={person.livesIn?.displayName ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
                <input name="livesInCity" defaultValue={person.livesIn?.city ?? ""} placeholder="City" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
                <input name="livesInState" defaultValue={person.livesIn?.state ?? ""} placeholder="State" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
                <input name="livesInCountry" defaultValue={person.livesIn?.country ?? ""} placeholder="Country" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
              </div>
              <div className="space-y-2">
                <label htmlFor="fromDisplay" className="text-sm font-medium text-slate-800">
                  From
                </label>
                <input id="fromDisplay" name="fromDisplay" defaultValue={person.from?.displayName ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
                <input name="fromCity" defaultValue={person.from?.city ?? ""} placeholder="City" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
                <input name="fromState" defaultValue={person.from?.state ?? ""} placeholder="State" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
                <input name="fromCountry" defaultValue={person.from?.country ?? ""} placeholder="Country" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="interests" className="text-sm font-medium text-slate-800">
                  Interests
                </label>
                <input id="interests" name="interests" defaultValue={(person.interests ?? []).join(", ")} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
              </div>
              <div className="space-y-2">
                <label htmlFor="tags" className="text-sm font-medium text-slate-800">
                  Tags
                </label>
                <input id="tags" name="tags" defaultValue={(person.tags ?? []).join(", ")} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="howMet" className="text-sm font-medium text-slate-800">
                How you met
              </label>
              <textarea id="howMet" name="howMet" rows={3} defaultValue={person.howMet ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="phones" className="text-sm font-medium text-slate-800">
                  Phones (comma separated)
                </label>
                <input id="phones" name="phones" defaultValue={(person.phones ?? []).map((item: { value: string }) => item.value).join(", ")} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
              </div>
              <div className="space-y-2">
                <label htmlFor="emails" className="text-sm font-medium text-slate-800">
                  Emails (comma separated)
                </label>
                <input id="emails" name="emails" defaultValue={(person.emails ?? []).map((item: { value: string }) => item.value).join(", ")} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="facts" className="text-sm font-medium text-slate-800">
                  Things to remember (comma separated)
                </label>
                <textarea id="facts" name="facts" rows={3} defaultValue={(person.facts ?? []).map((item: { content: string }) => item.content).join(", ")} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
              </div>
              <div className="space-y-2">
                <label htmlFor="links" className="text-sm font-medium text-slate-800">
                  Links (comma separated URLs)
                </label>
                <textarea id="links" name="links" rows={3} defaultValue={(person.links ?? []).map((item: { url: string }) => item.url).join(", ")} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="preferredMethods" className="text-sm font-medium text-slate-800">
                  Preferred methods
                </label>
                <input id="preferredMethods" name="preferredMethods" defaultValue={(person.contactPreferences?.preferredMethods ?? []).join(", ")} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
              </div>
              <div className="space-y-2">
                <label htmlFor="bestTime" className="text-sm font-medium text-slate-800">
                  Best time
                </label>
                <input id="bestTime" name="bestTime" defaultValue={person.contactPreferences?.bestTime ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="contactPreferenceNotes" className="text-sm font-medium text-slate-800">
                Contact preferences notes
              </label>
              <textarea id="contactPreferenceNotes" name="contactPreferenceNotes" rows={3} defaultValue={person.contactPreferences?.notes ?? ""} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring" />
            </div>

            <div className="pt-2">
              <button type="submit" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800">
                Save changes
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
