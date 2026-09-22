"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ModuleActionState } from "@/features/modules/module.types";

export type ModuleFormAction = (
  prevState: ModuleActionState,
  formData: FormData,
) => Promise<ModuleActionState>;

interface ModuleFormProps {
  action: ModuleFormAction;
  defaultValue?: { title: string; description: string };
  submitLabel: string;
  onSuccess?: () => void;
}

export function ModuleForm({
  action,
  defaultValue,
  submitLabel,
  onSuccess,
}: ModuleFormProps) {
  const [state, formAction, pending] = useActionState<
    ModuleActionState,
    FormData
  >(async (prevState, formData) => {
    const next = await action(prevState, formData);
    if (!next.error && !next.fieldErrors) {
      onSuccess?.();
    }
    return next;
  }, {});

  const titleErrors = state?.fieldErrors?.title;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="module-title"
          className="block text-sm font-medium text-zinc-200"
        >
          Title
        </label>
        <Input
          id="module-title"
          name="title"
          placeholder="e.g. Chord Progressions"
          required
          autoFocus
          maxLength={200}
          defaultValue={defaultValue?.title}
          aria-invalid={titleErrors ? true : undefined}
          aria-describedby={titleErrors ? "module-title-errors" : undefined}
        />
        {titleErrors ? (
          <ul id="module-title-errors" className="space-y-1">
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
          htmlFor="module-description"
          className="block text-sm font-medium text-zinc-200"
        >
          Description{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <Textarea
          id="module-description"
          name="description"
          placeholder="What does this module cover?"
          maxLength={5000}
          defaultValue={defaultValue?.description}
        />
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