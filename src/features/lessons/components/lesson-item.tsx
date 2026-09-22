"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { GripVerticalIcon, PlayIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Lesson, LessonProgress } from "@/db/schema";
import { learningPath } from "@/features/learning/learning.paths";
import { deleteLessonAction } from "@/features/lessons/lesson.actions";
import { LessonCompleteButton } from "@/features/progress/components/lesson-complete-button";
import {
  getLessonState,
  watchedPercent,
} from "@/features/progress/progress.calculations";
import { formatDuration } from "@/lib/format";

interface LessonItemProps {
  courseId: number;
  moduleId: number;
  lesson: Lesson;
  progress?: LessonProgress;
}

export function LessonItem({
  courseId,
  moduleId,
  lesson,
  progress,
}: LessonItemProps) {
  const title = lesson.youtube_title ?? lesson.youtube_video_id;
  const source = lesson.youtube_channel_name ?? "YouTube";
  const duration = formatDuration(lesson.youtube_duration);
  const state = getLessonState(progress);
  const watched = watchedPercent(progress, lesson.youtube_duration);
  const href = learningPath(courseId, moduleId, lesson.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-zinc-900 shadow-sm transition-all duration-200 hover:border-zinc-700 hover:shadow-lg ${
        isDragging ? "border-brand z-50 shadow-lg" : "border-zinc-800"
      }`}
    >
      <div className="relative shrink-0">
        <Link
          href={href}
          className="relative block aspect-video w-full overflow-hidden bg-zinc-800"
        >
          {lesson.youtube_thumbnail_url ? (
            <Image
              src={lesson.youtube_thumbnail_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-zinc-700">
              <PlayIcon className="h-8 w-8" />
            </span>
          )}
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-300 backdrop-blur-sm">
            {String(lesson.position).padStart(2, "0")}
          </span>
          {duration ? (
            <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-100">
              {duration}
            </span>
          ) : null}
        </Link>
        <div className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-0.5">
          <LessonCompleteButton
            courseId={courseId}
            moduleId={moduleId}
            lessonId={lesson.id}
            state={state}
            title={title}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link
          href={href}
          className="line-clamp-2 text-sm font-semibold text-zinc-100 hover:text-brand"
        >
          {title}
        </Link>
        <p className="mt-1 truncate text-xs text-zinc-400">{source}</p>

        <div className="mt-auto pt-3">
          {state === "in_progress" && watched !== null ? (
            <ProgressBar
              percent={watched}
              label={`${watched}% watched`}
              className="h-1.5"
            />
          ) : null}
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-zinc-800 pt-2 text-xs text-zinc-400">
            {state === "in_progress" && watched !== null ? (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand" />
                {watched}% watched
              </span>
            ) : state === "completed" ? (
              <span className="flex items-center gap-1.5 text-success">
                <span className="h-2 w-2 rounded-full bg-success" />
                Completed
              </span>
            ) : (
              <span />
            )}
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                className="cursor-grab touch-none rounded p-1 text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
                aria-label={`Drag to reorder ${title}`}
                {...attributes}
                {...listeners}
              >
                <GripVerticalIcon className="h-4 w-4" />
              </button>
              <ConfirmDeleteButton
                iconOnly
                className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                triggerLabel="Remove lesson"
                heading="Remove Lesson?"
                description={`This will remove "${title}" from this module, along with its progress and notes.`}
                confirmLabel="Remove Lesson"
                action={deleteLessonAction.bind(null, courseId, moduleId, lesson.id)}
              />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
