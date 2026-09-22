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
import type { Module } from "@/db/schema";
import { reorderModulesAction } from "@/features/modules/module.actions";
import { deriveProgress } from "@/features/progress/progress.calculations";
import type { ProgressSummary } from "@/features/progress/progress.types";
import { ModuleCard } from "./module-card";

interface ModuleGridProps {
  courseId: number;
  modules: Module[];
  progressByModule: Map<number, ProgressSummary>;
}

export function ModuleGrid({
  courseId,
  modules,
  progressByModule,
}: ModuleGridProps) {
  const [search, setSearch] = useState("");
  const [localModules, setLocalModules] = useState(modules);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return localModules;
    return localModules.filter((mod) =>
      mod.title.toLowerCase().includes(term),
    );
  }, [localModules, search]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setLocalModules((prev) => {
        const oldIndex = prev.findIndex((m) => m.id === active.id);
        const newIndex = prev.findIndex((m) => m.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const next = [...prev];
        const [moved] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, moved);

        const orderedIds = next.map((m) => m.id);
        void reorderModulesAction(courseId, orderedIds);

        return next;
      });
    },
    [courseId],
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search modules…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          {search ? "No modules match your search." : "No modules yet."}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filtered.map((m) => m.id)}
            strategy={rectSortingStrategy}
          >
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((mod) => (
                <ModuleCard
                  key={mod.id}
                  module={mod}
                  progress={
                    progressByModule.get(mod.id) ?? deriveProgress(0, 0)
                  }
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
