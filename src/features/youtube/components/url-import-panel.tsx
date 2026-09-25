"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckIcon, LinkIcon, PlusIcon } from "@/components/ui/icons";
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
        toast.success("Video added to module");
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
    <>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 pl-3.5 transition focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-brand/30"
      >
        <LinkIcon className="h-5 w-5 shrink-0 text-zinc-500" />
        <input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setResult(null);
          }}
          placeholder="Paste a YouTube video URL…"
          aria-label="YouTube video URL"
          className="h-11 w-full min-w-0 flex-1 bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
        <Button
          type="submit"
          className="shrink-0"
          disabled={pending || url.trim().length === 0}
        >
          <PlusIcon className="h-4 w-4" />
          {pending ? "Adding…" : "Add to Module"}
        </Button>
      </form>
      {result?.error ? (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {result.error}
        </p>
      ) : null}
    </>
  );
}
