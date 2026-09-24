import { Container } from "@/components/ui/container";
import { getDb } from "@/db/client";
import { ContinueLearningCard } from "@/features/progress/components/continue-learning-card";
import { deriveProgress } from "@/features/progress/progress.calculations";
import {
  getContinueLearning,
  getCourseProgressMap,
} from "@/features/progress/progress.queries";
import { CompleteStepButton } from "@/features/profile/components/complete-step-button";
import { RecentlyStudiedSection } from "@/features/profile/components/recently-studied-section";
import { getProfile, getRecentlyStudiedCourses } from "@/features/profile/profile.queries";
import { getFirstLessonThumbnails } from "@/features/courses/course.queries";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const db = getDb();
  const installed = getProfile(db);
  const continueLearning = getContinueLearning(db);
  const progressByCourse = getCourseProgressMap(db);
  const thumbnailMap = getFirstLessonThumbnails(db);
  const recentlyStudied = getRecentlyStudiedCourses(db, 3);

  return (
    <Container className="space-y-8">
      {installed ? (
        <p className="text-sm text-zinc-400">
          Welcome back, {installed.name}
        </p>
      ) : null}

      {!installed ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center sm:p-10">
          <h2 className="text-lg font-medium text-zinc-100">
            Set up your learning space
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Give this installation a name to get started.
          </p>
          <div className="mt-6 flex justify-center">
            <CompleteStepButton />
          </div>
        </section>
      ) : null}

      {continueLearning ? (
        <ContinueLearningCard
          item={continueLearning}
          progress={
            progressByCourse.get(continueLearning.course.id) ??
            deriveProgress(0, 0)
          }
        />
      ) : null}

      <RecentlyStudiedSection
        items={recentlyStudied}
        progressByCourse={progressByCourse}
        thumbnailMap={thumbnailMap}
      />
    </Container>
  );
}