"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CourseActionState } from "@/features/courses/course.types";

export type CourseFormAction = (
  prevState: CourseActionState,
  formData: FormData,
) => Promise<CourseActionState>;

interface CourseFormProps {
  action: CourseFormAction;
  defaultValue?: { title: string; description: string; goal?: string };
  submitLabel: string;
  onSuccess?: () => void;
}

export function CourseForm({
  action,
  defaultValue,
  submitLabel,
  onSuccess,
}: CourseFormProps) {
  const [state, formAction, pending] = useActionState<
    CourseActionState,
    FormData
  >(async (prevState, formData) => {
    const next = await action(prevState, formData);
    if (!next.error && !next.fieldErrors) {
      toast.success(defaultValue ? "Course updated" : "Course created");
      onSuccess?.();
    }
    return next;
  }, {});

  const titleErrors = state?.fieldErrors?.title;
  const goalErrors = state?.fieldErrors?.goal;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="course-title"
          className="block text-sm font-medium text-zinc-200"
        >
          Title
        </label>
        <Input
          id="course-title"
          name="title"
          placeholder="e.g. Real Estate"
          required
          autoFocus
          maxLength={200}
          defaultValue={defaultValue?.title}
          aria-invalid={titleErrors ? true : undefined}
          aria-describedby={titleErrors ? "course-title-errors" : undefined}
        />
        {titleErrors ? (
          <ul id="course-title-errors" className="space-y-1">
            {titleErrors.map((message) => (
              <li key={message} className="text-sm text-red-400">
                {message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="course-description"
          className="block text-sm font-medium text-zinc-200"
        >
          Description{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <Textarea
          id="course-description"
          name="description"
          placeholder="What do you want to learn?"
          maxLength={5000}
          defaultValue={defaultValue?.description}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="course-goal"
          className="block text-sm font-medium text-zinc-200"
        >
          Learning goal{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <Textarea
          id="course-goal"
          name="goal"
          placeholder="e.g. Learn to play worship piano confidently"
          maxLength={500}
          defaultValue={defaultValue?.goal}
          aria-invalid={goalErrors ? true : undefined}
          aria-describedby={goalErrors ? "course-goal-errors" : undefined}
        />
        {goalErrors ? (
          <ul id="course-goal-errors" className="space-y-1">
            {goalErrors.map((message) => (
              <li key={message} className="text-sm text-red-400">
                {message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}