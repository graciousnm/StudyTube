import { Container } from "@/components/ui/container";
import { BookOpenIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { getDb } from "@/db/client";
import { CourseGrid } from "@/features/courses/components/course-grid";
import { listCourses } from "@/features/courses/course.queries";
import { CreateCourseButton } from "@/features/ai/components/create-course-button";
import { ContinueLearningCard } from "@/features/progress/components/continue-learning-card";
import { deriveProgress } from "@/features/progress/progress.calculations";
import {
  getContinueLearning,
  getCourseProgressMap,
} from "@/features/progress/progress.queries";
import { CompleteStepButton } from "@/features/profile/components/complete-step-button";
import { getProfile } from "@/features/profile/profile.queries";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const db = getDb();
  const courses = listCourses(db);
  const installed = getProfile(db);
  const continueLearning = getContinueLearning(db);
  const progressByCourse = getCourseProgressMap(db);
  const aiAvailable = !!process.env.OPENROUTER_API_KEY;

  return (
    <Container className="space-y-8">
      {installed ? (
        <p className="text-sm text-zinc-400">
          Welcome back, {installed.name}
        </p>
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

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          My Courses
        </h1>
        <CreateCourseButton aiAvailable={aiAvailable} />
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpenIcon className="h-8 w-8" />}
          title="No courses yet"
          description="Create a course and start building your learning path."
        >
          <CreateCourseButton label="Create Course" aiAvailable={aiAvailable} />
          {!installed ? <CompleteStepButton /> : null}
        </EmptyState>
      ) : (
        <CourseGrid courses={courses} progressByCourse={progressByCourse} />
      )}
    </Container>
  );
}