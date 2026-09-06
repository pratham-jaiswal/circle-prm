"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  type: "person" | "note" | "interaction" | "event" | "reminder" | "relationship";
};

const quickLinks = [
  { href: "/people", label: "People" },
  { href: "/notes", label: "Notes" },
  { href: "/interactions", label: "Interactions" },
  { href: "/events", label: "Events" },
  { href: "/reminders", label: "Reminders" },
  { href: "/relationships", label: "Relationships" },
  { href: "/connections", label: "Connections" },
  { href: "/saved-views", label: "Saved Views" },
];

const quickAdd = [
  { href: "/people/new", label: "Add Person" },
  { href: "/notes/new", label: "Add Note" },
  { href: "/interactions/new", label: "Add Interaction" },
  { href: "/reminders/new", label: "Add Reminder" },
  { href: "/events/new", label: "Add Event" },
];

export function GlobalCommandPalette() {
  const pathname = usePathname();
  const router = useRouter();
  const isDisabledRoute = pathname === "/sign-in";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const closePalette = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
  };

  useEffect(() => {
    if (isDisabledRoute) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => {
          const next = !value;
          if (!next) {
            setQuery("");
            setResults([]);
            setActiveIndex(-1);
          }
          return next;
        });
      }

      if (event.key === "Escape") {
        closePalette();
      }

      if (!open) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) =>
          results.length === 0 ? -1 : Math.min(current + 1, results.length - 1),
        );
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => (results.length === 0 ? -1 : Math.max(current - 1, 0)));
      }

      if (event.key === "Enter" && activeIndex >= 0 && activeIndex < results.length) {
        event.preventDefault();
        const selected = results[activeIndex];
        closePalette();
        router.push(selected.href);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, isDisabledRoute, open, results, router]);

  useEffect(() => {
    if (!open || isDisabledRoute) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDisabledRoute, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setActiveIndex(-1);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { results?: SearchItem[] };
        const nextResults = data.results ?? [];
        setResults(nextResults);
        setActiveIndex(nextResults.length > 0 ? 0 : -1);
      } catch {
        setResults([]);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [open, query]);

  const grouped = useMemo(() => {
    return results.reduce<Record<string, SearchItem[]>>((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {});
  }, [results]);

  if (isDisabledRoute) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 z-40 inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-[0_16px_40px_rgba(15,23,42,0.14)] transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      >
        Search
        <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] normal-case tracking-normal text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Ctrl K
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 px-4 pt-24"
          onClick={closePalette}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_28px_80px_rgba(15,23,42,0.25)] dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
          >
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people, notes, events..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />

            <div className="mt-4 max-h-[60vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/70">
              {query.trim().length < 2 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Quick add
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {quickAdd.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closePalette}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  <p className="pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Quick links
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {quickLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closePalette}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : loading ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">Searching...</p>
              ) : results.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">No matches found. Try a different keyword.</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Use Up/Down arrows and Enter to open a result.</p>
                  {Object.entries(grouped).map(([type, items]) => (
                    <section key={type} className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        {type}
                      </h3>
                      <ul className="space-y-2">
                        {items.map((item) => {
                          const resultIndex = results.findIndex((result) => result.id === item.id);
                          const isActive = resultIndex === activeIndex;

                          return (
                            <li key={item.id}>
                              <Link
                                href={item.href}
                                onClick={closePalette}
                                className={`block rounded-xl border px-3 py-2 transition hover:border-slate-300 hover:bg-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800 ${
                                  isActive
                                    ? "border-slate-400 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
                                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                                }`}
                              >
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                                {item.subtitle ? (
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                                ) : null}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
