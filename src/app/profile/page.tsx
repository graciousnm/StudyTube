import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getDb } from "@/db/client";
import { LearnerStatsPanel } from "@/features/profile/components/learner-stats-panel";
import { NameEditDialog } from "@/features/profile/components/name-edit-dialog";
import { getLearnerStats, getProfile } from "@/features/profile/profile.queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  const db = getDb();
  const installed = getProfile(db);
  if (!installed) {
    redirect("/onboarding");
  }

  const stats = getLearnerStats(db);

  return (
    <Container className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            {installed.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Learner profile · all stats are local to this installation
          </p>
        </div>
        <NameEditDialog name={installed.name} />
      </div>

      <LearnerStatsPanel stats={stats} />
    </Container>
  );
}