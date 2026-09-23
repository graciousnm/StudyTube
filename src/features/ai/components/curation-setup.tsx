"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface CurationPreferences {
  channel?: string;
  notes?: string;
}

interface CurationSetupProps {
  onStart: (prefs: CurationPreferences) => void;
  onSkip: () => void;
}

export function CurationSetup({ onStart, onSkip }: CurationSetupProps) {
  const [addVideos, setAddVideos] = useState(false);
  const [channel, setChannel] = useState("");
  const [notes, setNotes] = useState("");

  function handleStart() {
    onStart({
      channel: channel.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  if (!addVideos) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">
          Your course and modules are ready. Add videos now or later.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setAddVideos(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500 hover:bg-zinc-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
              <span className="text-lg">&#x2728;</span>
            </div>
            <div>
              <p className="font-medium text-zinc-100">Add videos automatically</p>
              <p className="text-sm text-zinc-500">
                Let AI find matching videos for each topic
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex w-full items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500 hover:bg-zinc-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
              <ArrowRightIcon className="h-5 w-5 text-zinc-300" />
            </div>
            <div>
              <p className="font-medium text-zinc-100">Skip for now</p>
              <p className="text-sm text-zinc-500">
                Create the course without videos, add them later
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleStart();
      }}
      className="space-y-5"
    >
      <p className="text-sm text-zinc-400">
        Optional details help the AI find better videos in your courses.
      </p>

      <div className="space-y-1.5">
        <label
          htmlFor="curation-channel"
          className="block text-sm font-medium text-zinc-200"
        >
          Preferred channel{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <Input
          id="curation-channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          placeholder="e.g. Piano Keyboard Guide"
          maxLength={200}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="curation-notes"
          className="block text-sm font-medium text-zinc-200"
        >
          Anything else the AI should know{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <Textarea
          id="curation-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. short practical demos, no live streams"
          maxLength={1000}
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setAddVideos(false)}
        >
          Back
        </Button>
        <Button type="submit" variant="primary">
          Start Curation
        </Button>
      </div>
    </form>
  );
}