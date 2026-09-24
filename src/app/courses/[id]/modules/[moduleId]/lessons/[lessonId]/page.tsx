import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getDb } from "@/db/client";
import { courseIdSchema } from "@/features/courses/course.validation";
import { LearningView } from "@/features/learning/components/learning-view";
import { getLearningContext } from "@/features/learning/learning.queries";
import { lessonIdSchema } from "@/features/lessons/lesson.validation";
import { moduleIdSchema } from "@/features/modules/module.validation";
import { getNoteByLesson } from "@/features/notes/notes.queries";
import {
  clampPlaybackPosition,
  getLessonState,
} from "@/features/progress/progress.calculations";
import { getLessonProgress } from "@/features/progress/progress.mutations";
import { getCourseProgress } from "@/features/progress/progress.queries";

export const dynamic = "force-dynamic";

interface LessonPageProps {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>;
}

function loadContext(id: string, moduleId: string, lessonId: string) {
  const courseId = courseIdSchema.safeParse(id);
  const parsedModuleId = moduleIdSchema.safeParse(moduleId);
  const parsedLessonId = lessonIdSchema.safeParse(lessonId);
  if (!courseId.success || !parsedModuleId.success || !parsedLessonId.success) {
    return undefined;
  }

  return getLearningContext(
    getDb(),
    courseId.data,
    parsedModuleId.data,
    parsedLessonId.data,
  );
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { id, moduleId, lessonId } = await params;
  const context = loadContext(id, moduleId, lessonId);
  if (!context) {
    return { title: "Lesson not found" };
  }

  return {
    title: `${context.lesson.youtube_title ?? context.lesson.youtube_video_id} · ${context.course.title}`,
    description: context.lesson.youtube_description || undefined,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id, moduleId, lessonId } = await params;
  const context = loadContext(id, moduleId, lessonId);
  if (!context) {
    notFound();
  }

  const db = getDb();
  const progress = getLessonProgress(db, context.lesson.id);
  const courseProgress = getCourseProgress(db, context.course.id);
  const title =
    context.lesson.youtube_title ?? context.lesson.youtube_video_id;
  const note = getNoteByLesson(db, context.lesson.id);
  const noteView = note
    ? {
        content: note.content,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      }
    : null;

  return (
    <Container size="2xl">
      <LearningView
        course={{ id: context.course.id, title: context.course.title }}
        module={{
          id: context.module.id,
          title: context.module.title,
          position: context.module.position,
        }}
        lesson={{
          id: context.lesson.id,
          videoId: context.lesson.youtube_video_id,
          title,
          channelName: context.lesson.youtube_channel_name,
          duration: context.lesson.youtube_duration,
        }}
        lessonNumber={context.lessonNumber}
        lessonCount={context.lessonCount}
        state={getLessonState(progress)}
        startSeconds={clampPlaybackPosition(
          progress?.playback_position_seconds ?? 0,
          context.lesson.youtube_duration,
        )}
        courseProgress={courseProgress}
        previous={context.previous}
        next={context.next}
        note={noteView}
      />
    </Container>
  );
}