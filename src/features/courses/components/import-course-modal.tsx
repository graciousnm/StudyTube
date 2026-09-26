"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { UploadIcon } from "@/components/ui/icons";
import { importCourseAction, type ImportCourseState } from "../course.actions";

interface ImportCourseModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportCourseModal({ open, onClose }: ImportCourseModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    importCourseAction,
    {} as ImportCourseState,
  );

  return (
    <Modal open={open} onClose={onClose} title="Import a Course">
      <form action={formAction} className="space-y-4">
        <p className="text-sm text-zinc-400">
          Choose a StudyTube course export file (`.studyforge-course.json`).
          The course and its modules and lessons will be added as a new course.
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-900 p-6 text-center transition-colors hover:border-zinc-500 hover:bg-zinc-800"
        >
          <UploadIcon className="h-6 w-6 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-200">
            {fileName ?? "Choose a file…"}
          </span>
          <span className="text-xs text-zinc-500">JSON export from StudyTube</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          name="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setFileName(file?.name ?? null);
          }}
        />

        {state?.error ? (
          <p role="alert" className="text-sm text-red-400">
            {state.error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={pending || !fileName}>
            {pending ? "Importing…" : "Import Course"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}