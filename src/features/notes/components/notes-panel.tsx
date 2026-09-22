"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { PencilIcon, PlusIcon, FileTextIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteNoteAction } from "@/features/notes/notes.actions";
import type { NoteView } from "@/features/notes/notes.types";
import { NoteCard } from "./note-card";
import { NoteFormModal } from "./note-form-modal";

interface NotesPanelProps {
  courseId: number;
  moduleId: number;
  lessonId: number;
  note: NoteView | null;
}

export function NotesPanel({
  courseId,
  moduleId,
  lessonId,
  note,
}: NotesPanelProps) {
  const [form, setForm] = useState<{ open: boolean; mode: "create" | "edit" }>({
    open: false,
    mode: "create",
  });

  function openForm(mode: "create" | "edit") {
    setForm({ open: true, mode });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-zinc-100">
          Notes
        </h2>
        {note ? (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openForm("edit")}
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </Button>
            <ConfirmDeleteButton
              triggerLabel="Delete"
              heading="Delete this note?"
              description="This permanently removes the note. Your lesson progress is not affected."
              confirmLabel="Delete note"
              pendingLabel="Deleting…"
              action={deleteNoteAction.bind(null, courseId, moduleId, lessonId)}
            />
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={() => openForm("create")}>
            <PlusIcon className="h-4 w-4" />
            Add note
          </Button>
        )}
      </div>

      {note ? (
        <NoteCard
          content={note.content}
          createdAt={note.createdAt}
          updatedAt={note.updatedAt}
        />
      ) : (
        <EmptyState
          icon={<FileTextIcon className="h-6 w-6" />}
          title="No notes yet"
          description="Add one to remember key ideas from this lesson."
        />
      )}

      {form.open ? (
        <NoteFormModal
          key={`${form.mode}-${note?.content ?? ""}`}
          open={form.open}
          onClose={() => setForm((f) => ({ ...f, open: false }))}
          courseId={courseId}
          moduleId={moduleId}
          lessonId={lessonId}
          mode={form.mode}
          initialContent={form.mode === "edit" ? (note?.content ?? "") : ""}
        />
      ) : null}
    </section>
  );
}