"use client";

import { useRouter } from "next/navigation";
import { useEffect, useActionState, type ComponentType } from "react";
import { toast } from "sonner";
import {
  CheckIcon,
  CircleIcon,
  ProgressHalfIcon,
} from "@/components/ui/icons";
import { setLessonCompletedAction } from "@/features/progress/progress.actions";
import type {
  LessonState,
  ProgressActionState,
} from "@/features/progress/progress.types";

interface LessonCompleteButtonProps {
  courseId: number;
  moduleId: number;
  lessonId: number;
  state: LessonState;
  title: string;
  showLabel?: boolean;
}

const stateIcon: Record<
  LessonState,
  ComponentType<{ className?: string }>
> = {
  not_started: CircleIcon,
  in_progress: ProgressHalfIcon,
  completed: CheckIcon,
};

export function LessonCompleteButton({
  courseId,
  moduleId,
  lessonId,
  state,
  title,
  showLabel = false,
}: LessonCompleteButtonProps) {
  const router = useRouter();
  const completed = state === "completed";
  const [actionState, formAction, pending] = useActionState<
    ProgressActionState,
    FormData
  >(
    setLessonCompletedAction.bind(null, courseId, moduleId, lessonId, !completed),
    {},
  );

  useEffect(() => {
    if (actionState.success) {
      toast.success(completed ? "Lesson marked complete" : "Lesson marked incomplete");
      router.refresh();
    }
  }, [actionState.success, router, completed]);

  const label = completed
    ? `Mark "${title}" as incomplete`
    : `Mark "${title}" as complete`;
  const StateIcon = stateIcon[state];
  const labeledClassName = `inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50 ${
    completed
      ? "border-success bg-success text-zinc-950"
      : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-brand hover:text-brand"
  }`;
  const iconClassName = `inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50 ${
    completed
      ? "bg-success text-zinc-950"
      : "border border-zinc-700 text-zinc-500 hover:border-brand hover:text-brand"
  }`;

  return (
    <form action={formAction} className="inline-flex">
      {showLabel ? (
        <button
          type="submit"
          disabled={pending}
          aria-label={label}
          title={label}
          className={labeledClassName}
        >
          <StateIcon className="h-4 w-4" />
          {completed ? "Completed" : "Mark as Complete"}
        </button>
      ) : (
        <button
          type="submit"
          disabled={pending}
          aria-label={label}
          title={label}
          className={iconClassName}
        >
          <StateIcon className="h-4 w-4" />
        </button>
      )}
      {actionState.error ? (
        <span role="alert" className="sr-only">
          {actionState.error}
        </span>
      ) : null}
    </form>
  );
}