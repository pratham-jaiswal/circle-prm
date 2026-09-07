"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function SignInCard() {
  const [pending, setPending] = useState(false);

  return (
    <section className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        Circle PRM
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Login
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">
        Access is limited to approved email addresses only.
      </p>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={async () => {
            setPending(true);
            try {
              await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
            } finally {
              setPending(false);
            }
          }}
          className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-65"
          disabled={pending}
        >
          {pending ? "Redirecting..." : "Continue with Google"}
        </button>
      </div>
    </section>
  );
}
