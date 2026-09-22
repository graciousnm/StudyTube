"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { addVideoToModuleAction } from "@/features/lessons/lesson.actions";
import type { LessonActionState } from "@/features/lessons/lesson.types";

interface AddVideoButtonProps {
  courseId: number;
  moduleId: number;
  videoId: string;
}

export function AddVideoButton({
  courseId,
  moduleId,
  videoId,
}: AddVideoButtonProps) {
  const [state, formAction, pending] = useActionState<
    LessonActionState,
    FormData
  >(addVideoToModuleAction.bind(null, courseId, moduleId, videoId), {});

  if (state?.success) {
    return (
      <Button type="button" size="sm" variant="secondary" disabled>
        <CheckIcon className="h-4 w-4" />
        Added
      </Button>
    );
  }

  return (
    <form action={formAction}>
      <Button type="submit" size="sm" variant="primary" disabled={pending}>
        {pending ? "Adding…" : "Add to Module"}
      </Button>
      {state?.error ? (
        <span role="alert" className="mt-1 block max-w-52 text-xs text-red-400">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}