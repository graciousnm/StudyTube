import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { Container } from "@/components/ui/container";
import { LayersIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { getDb } from "@/db/client";
import { deleteCourseAction } from "@/features/courses/course.actions";
import { getCourseById } from "@/features/courses/course.queries";
import { courseIdSchema } from "@/features/courses/course.validation";
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
        items={[{ label: "Courses", href: "/" }, { label: course.title }]}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight text-zinc-100">
              {course.title}
            </h1>
            <ConfirmDeleteButton
              iconOnly
              triggerLabel="Delete course"
              heading="Delete Course?"
              description={`This will permanently remove "${course.title}" and all of its modules, lessons, progress, and notes.`}
              confirmLabel="Delete Course"
              action={deleteCourseAction.bind(null, course.id)}
            />
          </div>
          <AddModuleButton courseId={course.id} size="sm" />
        </div>

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