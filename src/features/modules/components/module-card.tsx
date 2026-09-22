"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { CheckIcon, GripVerticalIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Module } from "@/db/schema";
import { deleteModuleAction } from "@/features/modules/module.actions";
import { progressLabel } from "@/features/progress/progress.calculations";
import type { ProgressSummary } from "@/features/progress/progress.types";

interface ModuleCardProps {
  module: Module;
  progress: ProgressSummary;
}

export function ModuleCard({ module, progress }: ModuleCardProps) {
  const courseId = module.course_id;
  const href = `/courses/${courseId}/modules/${module.id}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group relative flex h-full flex-col rounded-xl border bg-zinc-900 p-5 shadow-sm transition-all duration-200 hover:border-zinc-700 hover:shadow-lg ${
        isDragging ? "border-brand z-50 shadow-lg" : "border-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab touch-none rounded p-1 text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
            aria-label={`Drag to reorder ${module.title}`}
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon className="h-4 w-4" />
          </button>
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-400">
            {String(module.position).padStart(2, "0")}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {progress.isComplete ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-success">
              <CheckIcon className="h-3.5 w-3.5" />
              Complete
            </span>
          ) : null}
          <ConfirmDeleteButton
            iconOnly
            triggerLabel="Remove module"
            heading="Delete Module?"
            description={`This will permanently remove "${module.title}" and all of its lessons, progress, and notes.`}
            confirmLabel="Delete Module"
            action={deleteModuleAction.bind(null, courseId, module.id)}
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <h3 className="text-lg font-semibold leading-snug text-zinc-100">
          <Link href={href} className="hover:text-brand">
            {module.title}
          </Link>
        </h3>
        {module.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {module.description}
          </p>
        ) : null}
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
          <span
            className={progress.isComplete ? "font-medium text-success" : ""}
          >
            {progress.isComplete ? "Completed" : "Progress"}
          </span>
          <span className="font-medium text-zinc-300">
            {progressLabel(progress)}
          </span>
        </div>
        <ProgressBar
          percent={progress.percent}
          label={progressLabel(progress)}
          className="mt-1.5 h-1.5"
        />
      </div>
    </li>
  );
}
