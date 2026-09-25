"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  GenerateModuleInput,
  ModuleOutline,
} from "@/features/ai/ai.types";
import { generateModuleOutlineAction } from "@/features/ai/ai.actions";

interface ModuleAiFormProps {
  courseTitle: string;
  courseDescription: string;
  courseGoal?: string;
  onGenerated: (outline: ModuleOutline) => void;
  onCancel: () => void;
}

const detailOptions = [
  { value: "short" as const, label: "Short", desc: "2-4 topics" },
  { value: "standard" as const, label: "Standard", desc: "3-8 topics" },
  { value: "detailed" as const, label: "Detailed", desc: "5-10 topics" },
];

export function ModuleAiForm({
  courseTitle,
  courseDescription,
  courseGoal,
  onGenerated,
  onCancel,
}: ModuleAiFormProps) {
  const [focus, setFocus] = useState("");
  const [experience, setExperience] = useState("");
  const [detail, setDetail] = useState<GenerateModuleInput["detail"]>(
    "standard",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const result = await generateModuleOutlineAction({
        courseTitle,
        courseDescription,
        courseGoal,
        focus,
        experience: experience.trim() || undefined,
        detail,
      });
      if (result.error) {
        setError(result.error);
      } else if (result.outline) {
        onGenerated(result.outline);
      }
    } catch {
      setError("We couldn't generate a module right now. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {courseGoal ? (
        <p className="text-sm text-zinc-400">
          Course goal: <span className="text-zinc-300">{courseGoal}</span>
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="module-ai-focus"
          className="block text-sm font-medium text-zinc-200"
        >
          What should this module cover?
        </label>
        <Textarea
          id="module-ai-focus"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="e.g. dominant chords and how to use them in worship songs"
          required
          maxLength={1000}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="module-ai-experience"
          className="block text-sm font-medium text-zinc-200"
        >
          Your experience level{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <Textarea
          id="module-ai-experience"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="e.g. I can play basic chords but no music theory"
          maxLength={1000}
        />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-zinc-200">
          How detailed should the module be?
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
                name="module-ai-detail"
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
        <Button
          type="submit"
          variant="primary"
          disabled={pending || !focus.trim()}
        >
          {pending ? "Generating..." : "Generate Module"}
        </Button>
      </div>
    </form>
  );
}