import { redirect } from "next/navigation";

import { SignInCard } from "@/components/auth/sign-in-card";
import { isEmailAllowed } from "@/lib/auth/access";
import { getSession } from "@/lib/dal/auth";

export default async function SignInPage() {
  const session = await getSession();

  if (session?.user?.email && isEmailAllowed(session.user.email)) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8 sm:px-8 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_36%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)]" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <SignInCard />
      </div>
    </main>
  );
}
