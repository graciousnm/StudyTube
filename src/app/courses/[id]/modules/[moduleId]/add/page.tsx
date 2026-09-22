import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { getDb } from "@/db/client";
import { getCourseById } from "@/features/courses/course.queries";
import { courseIdSchema } from "@/features/courses/course.validation";
import { getModuleInCourse } from "@/features/modules/module.queries";
import { moduleIdSchema } from "@/features/modules/module.validation";
import { YouTubeSearchPanel } from "@/features/youtube/components/youtube-search-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Add YouTube Video",
};

interface AddVideoPageProps {
  params: Promise<{ id: string; moduleId: string }>;
}

export default async function AddVideoPage({ params }: AddVideoPageProps) {
  const { id, moduleId } = await params;
  const parsedCourseId = courseIdSchema.safeParse(id);
  const parsedModuleId = moduleIdSchema.safeParse(moduleId);
  if (!parsedCourseId.success || !parsedModuleId.success) {
    notFound();
  }

  const db = getDb();
  const course = getCourseById(db, parsedCourseId.data);
  const mod = course
    ? getModuleInCourse(db, course.id, parsedModuleId.data)
    : undefined;
  if (!course || !mod) {
    notFound();
  }

  return (
    <Container size="lg" className="space-y-8">
      <div>
        <Breadcrumbs
          items={[
            { label: "Courses", href: "/" },
            { label: course.title, href: `/courses/${course.id}` },
            {
              label: mod.title,
              href: `/courses/${course.id}/modules/${mod.id}`,
            },
            { label: "Add YouTube Video" },
          ]}
        />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
          Add YouTube Video
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Search YouTube, preview a video, and add it to {mod.title}.
        </p>
      </div>

      <section>
        <YouTubeSearchPanel courseId={course.id} moduleId={mod.id} />
      </section>
    </Container>
  );
}