"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useTransition, type ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/progress-bar";
import { learningPath } from "@/features/learning/learning.paths";
import type { LessonNeighbour } from "@/features/learning/learning.types";
import { LessonCompleteButton } from "@/features/progress/components/lesson-complete-button";
import { progressLabel } from "@/features/progress/progress.calculations";
import { savePlaybackPositionAction, setLessonCompletedAction } from "@/features/progress/progress.actions";
import { createPlaybackSaveQueue } from "@/features/progress/progress.queue";
import type {
  LessonState,
  ProgressSummary,
} from "@/features/progress/progress.types";
import { YouTubePlayer } from "@/features/youtube/components/youtube-player";
import { formatDuration } from "@/lib/format";

interface LearningViewProps {
  course: { id: number; title: string };
  module: { id: number; title: string; position: number };
  lesson: {
    id: number;
    videoId: string;
    title: string;
    channelName: string | null;
    duration: number | null;
  };
  lessonNumber: number;
  lessonCount: number;
  state: LessonState;
  startSeconds: number;
  courseProgress: ProgressSummary;
  previous?: LessonNeighbour;
  next?: LessonNeighbour;
  children?: ReactNode;
}

export function LearningView({
  course,
  module,
  lesson,
  lessonNumber,
  lessonCount,
  state,
  startSeconds,
  courseProgress,
  previous,
  next,
  children,
}: LearningViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const saveQueue = useMemo(
    () =>
      createPlaybackSaveQueue((input) =>
        savePlaybackPositionAction(lesson.id, input.position, input.duration),
      ),
    [lesson.id],
  );

  const handleProgress = useCallback(
    (seconds: number, duration: number) => {
      saveQueue.push({
        position: seconds,
        duration: duration > 0 ? duration : lesson.duration,
      });
    },
    [saveQueue, lesson.duration],
  );

  const handleEnded = useCallback(() => {
    if (state === "completed") return;
    startTransition(async () => {
      await setLessonCompletedAction(course.id, module.id, lesson.id, true);
      router.refresh();
    });
  }, [state, course.id, module.id, lesson.id, router]);

  const duration = formatDuration(lesson.duration);
  const moduleHref = `/courses/${course.id}/modules/${module.id}`;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Courses", href: "/" },
          { label: course.title, href: `/courses/${course.id}` },
          { label: module.title, href: moduleHref },
          { label: lesson.title },
        ]}
      />

      <div className="space-y-1">
        <p className="text-sm text-zinc-400">
          Module {module.position} · Lesson {lessonNumber} of {lessonCount}
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
          {lesson.title}
        </h1>
        <p className="text-sm text-zinc-400">
          {lesson.channelName ?? "YouTube"}
          {duration ? ` · ${duration}` : ""}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <YouTubePlayer
            videoId={lesson.videoId}
            title={lesson.title}
            startSeconds={startSeconds}
            onProgress={handleProgress}
            onEnded={handleEnded}
          />

          {startSeconds > 0 && (
            <p className="text-sm text-zinc-400">
              Resuming from {formatDuration(startSeconds)}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <LessonCompleteButton
              courseId={course.id}
              moduleId={module.id}
              lessonId={lesson.id}
              state={state}
              title={lesson.title}
              showLabel
            />

            {next ? (
              <Link
                href={learningPath(next.courseId, next.moduleId, next.lessonId)}
                className={buttonVariants({ variant: "primary" })}
              >
                Next Lesson
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href={`/courses/${course.id}`}
                className={buttonVariants({ variant: "secondary" })}
              >
                Back to Course
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-4">
            {previous ? (
              <Link
                href={learningPath(
                  previous.courseId,
                  previous.moduleId,
                  previous.lessonId,
                )}
                className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-100"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Previous Lesson
              </Link>
            ) : (
              <span />
            )}

            <div className="w-full max-w-xs">
              <ProgressBar
                percent={courseProgress.percent}
                label={progressLabel(courseProgress)}
              />
              <p className="mt-1 text-xs text-zinc-400">
                {progressLabel(courseProgress)}
              </p>
            </div>
          </div>
        </div>

        {children ? (
          <aside className="w-full shrink-0 border-t border-zinc-800 pt-4 lg:w-80 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
            {children}
          </aside>
        ) : null}
      </div>
    </div>
  );
}