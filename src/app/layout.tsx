import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { PlayIcon } from "@/components/ui/icons";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CreateCourseButton } from "@/features/ai/components/create-course-button";
import { ProfileEntry } from "@/features/profile/components/profile-entry";
import { getProfile } from "@/features/profile/profile.queries";
import { getDb } from "@/db/client";
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
  title: {
    default: "StudyTube",
    template: "%s · StudyTube",
  },
  description: "Build your own learning path from YouTube videos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const profile = getProfile(getDb());

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-100"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand text-white">
                  <PlayIcon className="h-3 w-3" />
                </span>
                <span className="hidden sm:inline">StudyTube</span>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <CreateCourseButton size="sm" variant="secondary" aiAvailable={!!process.env.OPENROUTER_API_KEY} />
                {profile ? <ProfileEntry name={profile.name} /> : null}
              </div>
            </div>
          </header>
          <main id="main-content" className="w-full flex-1 py-8 pb-20 sm:py-10 sm:pb-0">{children}</main>
        </Providers>
        <MobileNav />
      </body>
    </html>
  );
}