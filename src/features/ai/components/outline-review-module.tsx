"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CloseIcon, GripVerticalIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface OutlineReviewModuleProps {
  index: number;
  module: {
    title: string;
    description: string;
    topics: string[];
  };
  onUpdate: (module: {
    title: string;
    description: string;
    topics: string[];
  }) => void;
  onRemove: () => void;
}

export function OutlineReviewModule({
  index,
  module,
  onUpdate,
  onRemove,
}: OutlineReviewModuleProps) {
  const [newTopic, setNewTopic] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function addTopic() {
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    onUpdate({ ...module, topics: [...module.topics, trimmed] });
    setNewTopic("");
  }

  function removeTopic(topicIndex: number) {
    onUpdate({
      ...module,
      topics: module.topics.filter((_, i) => i !== topicIndex),
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-zinc-900 p-4 ${
        isDragging ? "border-brand z-50 shadow-lg" : "border-zinc-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 cursor-grab touch-none rounded p-1 text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
          aria-label={`Drag to reorder module ${index + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="h-4 w-4" />
        </button>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-500">
              Module {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost-danger"
              size="icon"
              onClick={onRemove}
              aria-label={`Remove module ${index + 1}`}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>

          <Input
            value={module.title}
            onChange={(e) => onUpdate({ ...module, title: e.target.value })}
            placeholder="Module title"
            maxLength={200}
          />

          <Textarea
            value={module.description}
            onChange={(e) =>
              onUpdate({ ...module, description: e.target.value })
            }
            placeholder="Module description (optional)"
            maxLength={5000}
            className="min-h-16"
          />

          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-400">Topics</span>
            <ul className="space-y-1.5">
              {module.topics.map((topic, topicIndex) => (
                <li key={topicIndex} className="flex items-center gap-2">
                  <span className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300">
                    {topic}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTopic(topicIndex)}
                    className="rounded p-1 text-zinc-500 hover:text-red-400"
                    aria-label={`Remove topic: ${topic}`}
                  >
                    <CloseIcon className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTopic();
                  }
                }}
                placeholder="Add a topic..."
                maxLength={200}
                className="h-8 text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addTopic}
                disabled={!newTopic.trim()}
              >
                <PlusIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
