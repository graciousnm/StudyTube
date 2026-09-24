import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { Container } from "@/components/ui/container";
import { PlusIcon } from "@/components/ui/icons";
import { PlayIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { getDb } from "@/db/client";
import { getCourseById } from "@/features/courses/course.queries";
import { courseIdSchema } from "@/features/courses/course.validation";
import { LessonGrid } from "@/features/lessons/components/lesson-grid";
import { listLessonsByModule } from "@/features/lessons/lesson.queries";
import { deleteModuleAction } from "@/features/modules/module.actions";
import { getModuleInCourse } from "@/features/modules/module.queries";
import { moduleIdSchema } from "@/features/modules/module.validation";
import { getLessonProgressMap } from "@/features/progress/progress.queries";

export const dynamic = "force-dynamic";

interface ModulePageProps {
  params: Promise<{ id: string; moduleId: string }>;
}

function loadModule(courseRaw: string, moduleRaw: string) {
  const courseId = courseIdSchema.safeParse(courseRaw);
  const moduleId = moduleIdSchema.safeParse(moduleRaw);
  if (!courseId.success || !moduleId.success) {
    return undefined;
  }

  const db = getDb();
  const course = getCourseById(db, courseId.data);
  if (!course) {
    return undefined;
  }

  const mod = getModuleInCourse(db, course.id, moduleId.data);
  if (!mod) {
    return undefined;
  }

  return { course, mod };
}

export async function generateMetadata({
  params,
}: ModulePageProps): Promise<Metadata> {
  const { id, moduleId } = await params;
  const loaded = loadModule(id, moduleId);
  if (!loaded) {
    return { title: "Module not found" };
  }
  return {
    title: `${loaded.mod.title} · ${loaded.course.title}`,
    description: loaded.mod.description || undefined,
  };
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { id, moduleId } = await params;
  const loaded = loadModule(id, moduleId);
  if (!loaded) {
    notFound();
  }

  const { course, mod } = loaded;
  const db = getDb();
  const lessons = listLessonsByModule(db, mod.id);
  const progressByLesson = getLessonProgressMap(db, mod.id);

  return (
    <Container className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Courses", href: "/courses" },
          { label: course.title, href: `/courses/${course.id}` },
          { label: mod.title },
        ]}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight text-zinc-100">
              {mod.title}
            </h1>
            <ConfirmDeleteButton
              iconOnly
              triggerLabel="Delete module"
              heading="Delete Module?"
              description={`This will permanently remove "${mod.title}" and all of its lessons, progress, and notes.`}
              confirmLabel="Delete Module"
              action={deleteModuleAction.bind(null, course.id, mod.id)}
            />
          </div>
          <Link
            href={`/courses/${course.id}/modules/${mod.id}/add`}
            className={`${buttonVariants({ variant: "primary", size: "sm" })} shrink-0`}
          >
            <PlusIcon className="h-4 w-4" />
            <span className="sm:hidden">Add Video</span>
            <span className="hidden sm:inline">Add YouTube Video</span>
          </Link>
        </div>

        {lessons.length === 0 ? (
          <EmptyState
            icon={<PlayIcon className="h-8 w-8" />}
            title="No lessons yet"
            description="Search YouTube and add your first video."
          />
        ) : (
          <LessonGrid
            courseId={course.id}
            moduleId={mod.id}
            lessons={lessons}
            progressByLesson={progressByLesson}
            columns={3}
          />
        )}
      </section>
    </Container>
  );
}