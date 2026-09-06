"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function FloatingThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="fixed bottom-6 right-6 z-50 inline-flex h-10 w-20 items-center rounded-full border border-slate-300 bg-white/90 px-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white dark:border-slate-700 dark:bg-slate-900/90 dark:hover:bg-slate-900"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <span className="absolute h-7 w-8 translate-x-0 rounded-full bg-slate-900 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:translate-x-9 dark:bg-slate-100" />
      <span className="relative z-10 flex w-full items-center justify-between px-1">
        <Sun className="h-4 w-4 scale-100 text-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:scale-90 dark:text-slate-400" />
        <Moon className="h-4 w-4 scale-90 text-slate-500 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:scale-100 dark:text-slate-900" />
      </span>
    </button>
  );
}
