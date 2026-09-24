import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { LayersIcon, TargetIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { getDb } from "@/db/client";
import { getCourseById } from "@/features/courses/course.queries";
import { courseIdSchema } from "@/features/courses/course.validation";
import { CourseActionsMenu } from "@/features/courses/components/course-actions-menu";
import { AddModuleButton } from "@/features/modules/components/add-module-button";
import { ModuleGrid } from "@/features/modules/components/module-grid";
import { listModulesByCourse } from "@/features/modules/module.queries";
import { getModuleProgressMap } from "@/features/progress/progress.queries";

export const dynamic = "force-dynamic";

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

function loadCourse(rawId: string) {
  const parsedId = courseIdSchema.safeParse(rawId);
  if (!parsedId.success) {
    return undefined;
  }
  return getCourseById(getDb(), parsedId.data);
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { id } = await params;
  const course = loadCourse(id);
  if (!course) {
    return { title: "Course not found" };
  }
  return {
    title: course.title,
    description: course.description || undefined,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  const course = loadCourse(id);
  if (!course) {
    notFound();
  }

  const db = getDb();
  const modules = listModulesByCourse(db, course.id);
  const progressByModule = getModuleProgressMap(db, course.id);

  return (
    <Container className="space-y-8">
      <Breadcrumbs
        items={[{ label: "Courses", href: "/courses" }, { label: course.title }]}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight text-zinc-100">
              {course.title}
            </h1>
            <CourseActionsMenu
              courseId={course.id}
              title={course.title}
              description={course.description}
              goal={course.goal ?? undefined}
            />
          </div>
          <div className="shrink-0">
            <AddModuleButton courseId={course.id} size="sm" />
          </div>
        </div>

        {course.description && (
          <p className="text-sm text-zinc-400">{course.description}</p>
        )}

        {course.goal && (
          <div className="flex items-start gap-2 rounded-lg border border-brand/30 bg-brand/10 p-3 text-sm text-zinc-200">
            <TargetIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>
              <span className="font-medium text-zinc-100">Goal: </span>
              {course.goal}
            </span>
          </div>
        )}

        {modules.length === 0 ? (
          <EmptyState
            icon={<LayersIcon className="h-8 w-8" />}
            title="No modules yet"
            description="Add your first module to start organising your lessons."
          />
        ) : (
          <ModuleGrid
            courseId={course.id}
            modules={modules}
            progressByModule={progressByModule}
          />
        )}
      </section>
    </Container>
  );
}