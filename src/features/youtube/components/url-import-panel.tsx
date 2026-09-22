"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { addVideoByUrlAction } from "@/features/lessons/lesson.actions";

interface UrlImportPanelProps {
  courseId: number;
  moduleId: number;
}

export function UrlImportPanel({ courseId, moduleId }: UrlImportPanelProps) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const state = await addVideoByUrlAction(courseId, moduleId, trimmed);
      setResult(state);
      if (state.success) {
        setUrl("");
      }
    });
  }

  if (result?.success) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
        <CheckIcon className="h-5 w-5 text-success" />
        <p className="text-sm text-zinc-100">Video added to module.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <Input
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          setResult(null);
        }}
        placeholder="Paste a YouTube video URL…"
        className="max-w-2xl h-11 text-base"
      />
      <Button type="submit" disabled={pending || url.trim().length === 0}>
        <PlusIcon className="h-4 w-4" />
        {pending ? "Adding…" : "Add to Module"}
      </Button>
      {result?.error ? (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {result.error}
        </p>
      ) : null}
    </form>
  );
}
