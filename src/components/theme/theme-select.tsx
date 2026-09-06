"use client";

import { useTheme } from "next-themes";

type ThemeSelectProps = {
  initialTheme: "system" | "light" | "dark";
};

export function ThemeSelect({ initialTheme }: ThemeSelectProps) {
  const { theme, setTheme } = useTheme();

  return (
    <select
      id="theme"
      name="theme"
      defaultValue={theme ?? initialTheme}
      onChange={(event) => setTheme(event.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
