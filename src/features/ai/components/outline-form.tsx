"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CourseOutline, GenerateOutlineInput } from "@/features/ai/ai.types";
import { generateOutlineAction } from "@/features/ai/ai.actions";

interface OutlineFormProps {
  onGenerated: (outline: CourseOutline) => void;
  onCancel: () => void;
}

const detailOptions = [
  { value: "short" as const, label: "Short", desc: "2-4 modules" },
  { value: "standard" as const, label: "Standard", desc: "3-8 modules" },
  { value: "detailed" as const, label: "Detailed", desc: "5-12 modules" },
];

export function OutlineForm({ onGenerated, onCancel }: OutlineFormProps) {
  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState("");
  const [detail, setDetail] = useState<GenerateOutlineInput["detail"]>(
    "standard",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const result = await generateOutlineAction({ goal, experience, detail });
      if (result.error) {
        setError(result.error);
      } else if (result.outline) {
        onGenerated(result.outline);
      }
    } catch {
      setError(
        "We couldn't generate your learning path right now. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="ai-goal"
          className="block text-sm font-medium text-zinc-200"
        >
          What do you want to learn?
        </label>
        <Textarea
          id="ai-goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. I want to learn worship piano from beginner level."
          required
          maxLength={1000}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="ai-experience"
          className="block text-sm font-medium text-zinc-200"
        >
          Your experience level{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <Textarea
          id="ai-experience"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="e.g. I'm a complete beginner."
          maxLength={1000}
        />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-zinc-200">
          How detailed should the outline be?
        </span>
        <div className="flex flex-wrap gap-3">
          {detailOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                detail === opt.value
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              <input
                type="radio"
                name="detail"
                value={opt.value}
                checked={detail === opt.value}
                onChange={() => setDetail(opt.value)}
                className="sr-only"
              />
              <span className="font-medium">{opt.label}</span>
              <span className="text-xs text-zinc-500">({opt.desc})</span>
            </label>
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={pending || !goal.trim()}>
          {pending ? "Generating..." : "Generate Outline"}
        </Button>
      </div>
    </form>
  );
}
