"use client";

import { useCallback, useState } from "react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon } from "@/components/ui/icons";
import type { CourseOutline, CourseOutlineModule, ModuleTopics } from "@/features/ai/ai.types";
import { createCourseFromOutlineAction } from "@/features/ai/ai.actions";
import { OutlineReviewModule } from "./outline-review-module";

interface OutlineReviewProps {
  outline: CourseOutline;
  onRegenerate: () => void;
  onCreated: (data: { courseId: number; modules: ModuleTopics[] }) => void;
}

export function OutlineReview({ outline, onRegenerate, onCreated }: OutlineReviewProps) {
  const [title, setTitle] = useState(outline.title);
  const [description, setDescription] = useState(outline.description);
  const [modules, setModules] = useState<CourseOutlineModule[]>(
    outline.modules,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setModules((prev) => {
      const oldIndex = active.id as number;
      const newIndex = over.id as number;
      const next = [...prev];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);
      return next;
    });
  }, []);

  function updateModule(index: number, updated: CourseOutlineModule) {
    setModules((prev) => prev.map((m, i) => (i === index ? updated : m)));
  }

  function removeModule(index: number) {
    setModules((prev) => prev.filter((_, i) => i !== index));
  }

  function addModule() {
    setModules((prev) => [
      ...prev,
      { title: "", description: "", topics: [] },
    ]);
  }

  async function handleCreate() {
    setError(null);

    if (!title.trim()) {
      setError("Course title is required.");
      return;
    }
    if (modules.length === 0) {
      setError("Add at least one module.");
      return;
    }
    for (let i = 0; i < modules.length; i++) {
      if (!modules[i].title.trim()) {
        setError(`Module ${i + 1} needs a title.`);
        return;
      }
    }

    setPending(true);
    try {
      const result = await createCourseFromOutlineAction({
        title: title.trim(),
        description: description.trim(),
        modules: modules.map((m) => ({
          title: m.title.trim(),
          description: m.description.trim(),
          topics: m.topics,
        })),
      });
      if (result.error) {
        setError(result.error);
      } else if (result.courseId && result.modules) {
        onCreated({
          courseId: result.courseId,
          modules: result.modules.map((m, i) => ({
            moduleId: m.moduleId,
            title: m.title,
            topics: modules[i]?.topics ?? [],
          })),
        });
      }
    } catch {
      setError("Failed to create the course. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="outline-title"
            className="block text-sm font-medium text-zinc-200"
          >
            Course Title
          </label>
          <Input
            id="outline-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="outline-description"
            className="block text-sm font-medium text-zinc-200"
          >
            Description
          </label>
          <Textarea
            id="outline-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
          />
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-sm font-medium text-zinc-200">
          Modules ({modules.length})
        </span>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={modules.map((_, i) => i)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {modules.map((mod, index) => (
                <OutlineReviewModule
                  key={index}
                  index={index}
                  module={mod}
                  onUpdate={(updated) => updateModule(index, updated)}
                  onRemove={() => removeModule(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addModule}
        >
          <PlusIcon className="h-4 w-4" />
          Add Module
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onRegenerate}
          disabled={pending}
        >
          Regenerate
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleCreate}
          disabled={pending}
        >
          {pending ? "Creating..." : "Create Course"}
        </Button>
      </div>
    </div>
  );
}
