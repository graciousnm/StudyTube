import { Container } from "@/components/ui/container";
import { BookOpenIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { getDb } from "@/db/client";
import { CourseGrid } from "@/features/courses/components/course-grid";
import { getFirstLessonThumbnails, listCourses } from "@/features/courses/course.queries";
import { CreateCourseButton } from "@/features/ai/components/create-course-button";
import { getCourseProgressMap } from "@/features/progress/progress.queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Courses",
};

export default function CoursesPage() {
  const db = getDb();
  const courses = listCourses(db);
  const progressByCourse = getCourseProgressMap(db);
  const thumbnailMap = getFirstLessonThumbnails(db);
  const aiAvailable = !!process.env.OPENROUTER_API_KEY;

  return (
    <Container className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Courses
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
        </EmptyState>
      ) : (
        <CourseGrid
          courses={courses}
          progressByCourse={progressByCourse}
          thumbnailMap={thumbnailMap}
        />
      )}
    </Container>
  );
}