"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { saveNoteAction } from "@/features/notes/notes.actions";
import { MAX_NOTE_LENGTH, type NoteActionState } from "@/features/notes/notes.types";

interface NoteFormModalProps {
  open: boolean;
  onClose: () => void;
  courseId: number;
  moduleId: number;
  lessonId: number;
  mode: "create" | "edit";
  initialContent: string;
}

export function NoteFormModal({
  open,
  onClose,
  courseId,
  moduleId,
  lessonId,
  mode,
  initialContent,
}: NoteFormModalProps) {
  const [value, setValue] = useState(initialContent);
  const [state, formAction, pending] = useActionState(
    async (prev: NoteActionState, formData: FormData) => {
      const result = await saveNoteAction(
        courseId,
        moduleId,
        lessonId,
        prev,
        formData,
      );
      if (!result.error && !result.fieldErrors) {
        onClose();
      }
      return result;
    },
    {},
  );
  const errors = state?.fieldErrors?.content;
  const submitLabel = mode === "edit" ? "Save note" : "Add note";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit note" : "Add note"}
    >
      <form action={formAction} className="space-y-3">
        <label htmlFor="note-content" className="sr-only">
          Note
        </label>
        <Textarea
          id="note-content"
          name="content"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={MAX_NOTE_LENGTH}
          autoFocus
          rows={8}
          placeholder="Remember key ideas from this lesson..."
          className="min-h-40"
          aria-invalid={errors ? true : undefined}
          aria-describedby={errors ? "note-content-errors" : undefined}
        />
        {errors ? (
          <ul id="note-content-errors" className="space-y-1">
            {errors.map((message) => (
              <li key={message} className="text-sm text-red-400">
                {message}
              </li>
            ))}
          </ul>
        ) : null}
        {state?.error ? (
          <p role="alert" className="text-sm text-red-400">
            {state.error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-500">
            {value.length} / {MAX_NOTE_LENGTH}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}