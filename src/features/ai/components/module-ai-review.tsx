"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CloseIcon, PlusIcon } from "@/components/ui/icons";
import type { ModuleOutline } from "@/features/ai/ai.types";
import { createModuleFromOutlineAction } from "@/features/ai/ai.actions";

interface ModuleAiReviewProps {
  courseId: number;
  outline: ModuleOutline;
  onRegenerate: () => void;
  onCreated: (data: { moduleId: number; title: string; topics: string[] }) => void;
}

export function ModuleAiReview({
  courseId,
  outline,
  onRegenerate,
  onCreated,
}: ModuleAiReviewProps) {
  const [title, setTitle] = useState(outline.title);
  const [description, setDescription] = useState(outline.description);
  const [topics, setTopics] = useState<string[]>(outline.topics);
  const [newTopic, setNewTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function addTopic() {
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    setTopics((prev) => [...prev, trimmed]);
    setNewTopic("");
  }

  function removeTopic(index: number) {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate() {
    setError(null);
    if (!title.trim()) {
      setError("Module title is required.");
      return;
    }
    if (topics.length === 0) {
      setError("Add at least one topic.");
      return;
    }

    setPending(true);
    try {
      const result = await createModuleFromOutlineAction(courseId, {
        title: title.trim(),
        description: description.trim(),
        topics,
      });
      if (result.error) {
        setError(result.error);
      } else if (result.moduleId && result.title && result.topics) {
        onCreated({
          moduleId: result.moduleId,
          title: result.title,
          topics: result.topics,
        });
      }
    } catch {
      setError("Failed to create the module. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="module-ai-review-title"
            className="block text-sm font-medium text-zinc-200"
          >
            Module Title
          </label>
          <Input
            id="module-ai-review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="module-ai-review-description"
            className="block text-sm font-medium text-zinc-200"
          >
            Description
          </label>
          <Textarea
            id="module-ai-review-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
          />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-zinc-200">
          Topics ({topics.length})
        </span>
        <ul className="space-y-1.5">
          {topics.map((topic, topicIndex) => (
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
          {pending ? "Creating..." : "Create Module"}
        </Button>
      </div>
    </div>
  );
}