import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { GlobalCommandPalette } from "@/components/search/global-command-palette";
import { AppThemeProvider } from "@/components/theme/app-theme-provider";
import { FloatingThemeToggle } from "@/components/theme/floating-theme-toggle";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Circle PRM",
  description: "Private-first personal relationship manager.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        <AppThemeProvider>
          {children}
          <FloatingThemeToggle />
          <GlobalCommandPalette />
        </AppThemeProvider>
      </body>
    </html>
  );
}
