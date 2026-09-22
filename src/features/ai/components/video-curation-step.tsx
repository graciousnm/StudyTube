"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckIcon, CloseIcon, PlayIcon } from "@/components/ui/icons";
import type {
  CuratedVideo,
  ModuleCuration,
  ModuleTopics,
  TopicSearchResults,
  VideoSelection,
} from "@/features/ai/ai.types";
import {
  generateSearchQueriesAction,
  searchYouTubeBatchAction,
  selectBestVideosAction,
  addCuratedVideosAction,
} from "@/features/ai/ai.actions";

interface VideoCurationStepProps {
  courseId: number;
  modules: ModuleTopics[];
  courseTitle: string;
  courseDescription: string;
  onDone: () => void;
  onSkip: () => void;
}

type CurationPhase =
  | { status: "queries" }
  | { status: "searching" }
  | { status: "selecting" }
  | { status: "review" }
  | { status: "adding" };

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function assembleCurations(
  modules: ModuleTopics[],
  results: TopicSearchResults[],
  selections: VideoSelection[],
): ModuleCuration[] {
  return modules.map((mod, mi) => ({
    moduleId: mod.moduleId,
    title: mod.title,
    topics: mod.topics.map((topic, ti) => {
      const selection = selections.find(
        (s) => s.moduleIndex === mi && s.topicIndex === ti,
      );
      const topicResults = results.find(
        (t) => t.moduleIndex === mi && t.topicIndex === ti,
      );
      const video = selection?.videoId
        ? topicResults?.results.find(
            (r) => r.youtubeVideoId === selection.videoId,
          ) ?? null
        : null;
      return {
        topic,
        query: topicResults?.query ?? topic,
        video: video
          ? {
              youtubeVideoId: video.youtubeVideoId,
              title: video.title,
              channelName: video.channelName,
              thumbnailUrl: null,
              durationSeconds: video.durationSeconds,
            }
          : null,
      };
    }),
  }));
}

export function VideoCurationStep({
  courseId,
  modules,
  courseTitle,
  courseDescription,
  onDone,
  onSkip,
}: VideoCurationStepProps) {
  const [phase, setPhase] = useState<CurationPhase>({ status: "queries" });
  const [curations, setCurations] = useState<ModuleCuration[]>([]);
  const [accepted, setAccepted] = useState<Map<string, CuratedVideo>>(
    new Map(),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const input = { courseTitle, courseDescription, modules };

      setPhase({ status: "queries" });
      const queriesResult = await generateSearchQueriesAction(input);
      if (cancelled) return;
      if (queriesResult.error) {
        setError(queriesResult.error);
        setPhase({ status: "review" });
        return;
      }

      setPhase({ status: "searching" });
      const searchResult = await searchYouTubeBatchAction(
        queriesResult.queries!,
      );
      if (cancelled) return;
      if (searchResult.error) {
        setError(searchResult.error);
        setPhase({ status: "review" });
        return;
      }

      setPhase({ status: "selecting" });
      const selectionsResult = await selectBestVideosAction(
        input,
        searchResult.results!,
      );
      if (cancelled) return;
      if (selectionsResult.error) {
        setError(selectionsResult.error);
        setPhase({ status: "review" });
        return;
      }

      const curationResult = assembleCurations(
        modules,
        searchResult.results!,
        selectionsResult.selections!,
      );
      setCurations(curationResult);

      const initial = new Map<string, CuratedVideo>();
      for (const mod of curationResult) {
        for (const topic of mod.topics) {
          if (topic.video) {
            initial.set(`${mod.moduleId}-${topic.topic}`, topic.video);
          }
        }
      }
      setAccepted(initial);
      setPhase({ status: "review" });
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [courseTitle, courseDescription, modules]);

  function toggleVideo(moduleId: number, topic: string, video: CuratedVideo) {
    const key = `${moduleId}-${topic}`;
    setAccepted((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, video);
      }
      return next;
    });
  }

  function acceptAll() {
    const next = new Map<string, CuratedVideo>();
    for (const mod of curations) {
      for (const topic of mod.topics) {
        if (topic.video) {
          next.set(`${mod.moduleId}-${topic.topic}`, topic.video);
        }
      }
    }
    setAccepted(next);
  }

  function rejectAll() {
    setAccepted(new Map());
  }

  async function handleAdd() {
    setPhase({ status: "adding" });
    setError(null);

    const videos: { moduleId: number; videoId: string }[] = [];
    for (const [key, video] of accepted) {
      const moduleId = Number.parseInt(key.split("-")[0], 10);
      videos.push({ moduleId, videoId: video.youtubeVideoId });
    }

    try {
      const result = await addCuratedVideosAction(courseId, videos);
      if (result.errors.length > 0) {
        setError(`Some videos couldn't be added: ${result.errors[0]}`);
      }
      onDone();
    } catch {
      setError("Failed to add videos. Please try again.");
      setPhase({ status: "review" });
    }
  }

  if (phase.status === "queries") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
        <p className="text-sm text-zinc-400">
          Generating optimized search queries...
        </p>
      </div>
    );
  }

  if (phase.status === "searching") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
        <p className="text-sm text-zinc-400">
          Searching YouTube for videos...
        </p>
      </div>
    );
  }

  if (phase.status === "selecting") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
        <p className="text-sm text-zinc-400">
          AI is selecting the best videos...
        </p>
      </div>
    );
  }

  if (phase.status === "adding") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
        <p className="text-sm text-zinc-400">Adding videos to your course...</p>
      </div>
    );
  }

  const totalTopics = curations.reduce((s, m) => s + m.topics.length, 0);
  const acceptedCount = accepted.size;

  return (
    <div className="space-y-5">
      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {acceptedCount} of {totalTopics} topics matched
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={acceptAll}
          >
            Accept All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={rejectAll}
          >
            Reject All
          </Button>
        </div>
      </div>

      <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
        {curations.map((mod) => (
          <div
            key={mod.moduleId}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <h3 className="mb-3 text-sm font-semibold text-zinc-200">
              {mod.title}
            </h3>
            <div className="space-y-3">
              {mod.topics.map((topic) => {
                const key = `${mod.moduleId}-${topic.topic}`;
                const isSelected = accepted.has(key);
                return (
                  <div key={topic.topic} className="space-y-2">
                    <p className="text-xs text-zinc-500">{topic.topic}</p>
                    {topic.video ? (
                      <button
                        type="button"
                        onClick={() =>
                          toggleVideo(mod.moduleId, topic.topic, topic.video!)
                        }
                        className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors ${
                          isSelected
                            ? "border-brand bg-brand/5"
                            : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                        }`}
                      >
                        {topic.video.thumbnailUrl ? (
                          <Image
                            src={topic.video.thumbnailUrl}
                            alt=""
                            width={112}
                            height={64}
                            className="h-14 w-20 rounded object-cover sm:h-16 sm:w-28"
                          />
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded bg-zinc-800 sm:h-16 sm:w-28">
                            <PlayIcon className="h-5 w-5 text-zinc-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm text-zinc-200">
                            {topic.video.title}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {topic.video.channelName ?? "Unknown channel"}
                            {topic.video.durationSeconds
                              ? ` · ${formatDuration(topic.video.durationSeconds)}`
                              : ""}
                          </p>
                        </div>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            isSelected
                              ? "bg-brand text-white"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {isSelected ? (
                            <CheckIcon className="h-3 w-3" />
                          ) : (
                            <CloseIcon className="h-3 w-3" />
                          )}
                        </span>
                      </button>
                    ) : (
                      <p className="text-xs italic text-zinc-600">
                        No video found for this topic
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onSkip}
        >
          Skip for Now
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleAdd}
          disabled={acceptedCount === 0}
        >
          Add Selected Videos
        </Button>
      </div>
    </div>
  );
}
