import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getDb } from "@/db/client";
import { OnboardingForm } from "@/features/profile/components/onboarding-form";
import { getProfile } from "@/features/profile/profile.queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Name this installation",
};

export default function OnboardingPage() {
  const db = getDb();
  if (getProfile(db)) {
    redirect("/");
  }

  return (
    <Container className="flex min-h-[50vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          ← Back to StudyTube
        </Link>
        <OnboardingForm />
      </div>
    </Container>
  );
}