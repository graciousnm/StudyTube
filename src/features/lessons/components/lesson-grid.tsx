"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SearchIcon } from "@/components/ui/icons";
import type { Lesson, LessonProgress } from "@/db/schema";
import { reorderLessonsAction } from "@/features/lessons/lesson.actions";
import { getLessonState } from "@/features/progress/progress.calculations";
import type { LessonState } from "@/features/progress/progress.types";
import { LessonItem } from "./lesson-item";

type FilterState = "all" | LessonState;

interface LessonGridProps {
  courseId: number;
  moduleId: number;
  lessons: Lesson[];
  progressByLesson: Map<number, LessonProgress>;
  columns?: 2 | 3;
}

const gridStyles: Record<2 | 3, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
};

const tabs: { key: FilterState; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "in_progress", label: "In Progress" },
  { key: "not_started", label: "Not Started" },
];

export function LessonGrid({
  courseId,
  moduleId,
  lessons,
  progressByLesson,
  columns = 2,
}: LessonGridProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterState>("all");
  const [localLessons, setLocalLessons] = useState(lessons);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return localLessons.filter((lesson) => {
      const title = (
        lesson.youtube_title ?? lesson.youtube_video_id
      ).toLowerCase();
      const channel = (lesson.youtube_channel_name ?? "").toLowerCase();
      if (term && !title.includes(term) && !channel.includes(term)) return false;
      if (filter !== "all") {
        const state = getLessonState(progressByLesson.get(lesson.id));
        if (state !== filter) return false;
      }
      return true;
    });
  }, [localLessons, search, filter, progressByLesson]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setLocalLessons((prev) => {
        const oldIndex = prev.findIndex((l) => l.id === active.id);
        const newIndex = prev.findIndex((l) => l.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const next = [...prev];
        const [moved] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, moved);

        const orderedIds = next.map((l) => l.id);
        void reorderLessonsAction(courseId, moduleId, orderedIds);

        return next;
      });
    },
    [courseId, moduleId],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search lessons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          {search
            ? "No lessons match your search."
            : "No lessons in this category."}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filtered.map((l) => l.id)}
            strategy={rectSortingStrategy}
          >
            <ul className={`grid gap-4 ${gridStyles[columns]}`}>
              {filtered.map((lesson) => (
                <LessonItem
                  key={lesson.id}
                  courseId={courseId}
                  moduleId={moduleId}
                  lesson={lesson}
                  progress={progressByLesson.get(lesson.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
