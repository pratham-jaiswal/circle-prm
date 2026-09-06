"use client";

import { useState, useTransition } from "react";

import { createSavedViewAction, deleteSavedViewAction, type SavedViewActionState } from "@/actions/saved-views";
import { ToastBanner } from "@/components/ui/toast-banner";

type SavedViewItem = {
  publicId: string;
  name: string;
  filters: Record<string, unknown>;
};

const initialState: SavedViewActionState = {
  ok: false,
  message: "",
};

export function SavedViewsManager({ initialViews }: { initialViews: SavedViewItem[] }) {
  const [views, setViews] = useState(initialViews);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Create saved view</h2>
        <form
          action={(formData) => {
            startTransition(async () => {
              const result = await createSavedViewAction(initialState, formData);
              if (result.ok && result.savedView) {
                setViews((prev) => [result.savedView!, ...prev]);
                setToast({ type: "success", message: result.message });
              } else {
                setToast({ type: "error", message: result.message || "Unable to create saved view." });
              }
            });
          }}
          className="mt-4 space-y-4"
        >
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-800">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
              placeholder="Recent interactions"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="filters" className="text-sm font-medium text-slate-800">
              Filters (JSON)
            </label>
            <textarea
              id="filters"
              name="filters"
              rows={6}
              defaultValue="{}"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 disabled:opacity-65"
          >
            {isPending ? "Saving..." : "Save view"}
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Existing views</h2>
        <ul className="mt-5 space-y-3">
          {views.map((item) => (
            <li key={item.publicId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.publicId}</p>
                </div>
                <form
                  action={(formData) => {
                    startTransition(async () => {
                      const result = await deleteSavedViewAction(initialState, formData);
                      if (result.ok && result.deletedPublicId) {
                        setViews((prev) => prev.filter((entry) => entry.publicId !== result.deletedPublicId));
                        setToast({ type: "success", message: result.message });
                      } else {
                        setToast({ type: "error", message: result.message || "Unable to delete saved view." });
                      }
                    });
                  }}
                >
                  <input type="hidden" name="publicId" value={item.publicId} />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-65"
                  >
                    Delete
                  </button>
                </form>
              </div>
              <pre className="mt-3 overflow-auto rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-700">
                {JSON.stringify(item.filters ?? {}, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      </section>

      {toast ? <ToastBanner type={toast.type} message={toast.message} /> : null}
    </div>
  );
}
