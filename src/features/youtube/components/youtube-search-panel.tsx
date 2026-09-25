"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  CheckIcon,
  CloseIcon,
  LayersIcon,
  LinkIcon,
  SearchIcon,
} from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TabBar } from "@/components/ui/tabs";
import { AddVideoButton } from "@/features/youtube/components/add-video-button";
import { UrlImportPanel } from "@/features/youtube/components/url-import-panel";
import { PlaylistImportPanel } from "@/features/youtube/components/playlist-import-panel";
import type { YouTubeSearchResult } from "@/features/youtube/youtube.types";
import { formatDuration } from "@/lib/format";

type TabKey = "search" | "url" | "playlist";

const tabs: { key: TabKey; label: string; icon: ReactNode }[] = [
  { key: "search", label: "Search", icon: <SearchIcon className="h-4 w-4" /> },
  { key: "url", label: "Import URL", icon: <LinkIcon className="h-4 w-4" /> },
  {
    key: "playlist",
    label: "Import Playlist",
    icon: <LayersIcon className="h-4 w-4" />,
  },
];

interface YouTubeSearchPanelProps {
  courseId: number;
  moduleId: number;
  existingVideoIds?: Set<string>;
}

export function YouTubeSearchPanel({
  courseId,
  moduleId,
  existingVideoIds,
}: YouTubeSearchPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [preview, setPreview] = useState<YouTubeSearchResult | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreview(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    setNextPageToken(null);
    setPreview(null);
    try {
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(trimmed)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "YouTube search is temporarily unavailable.");
        return;
      }
      const allResults = data.results ?? [];
      setResults(allResults.filter(
        (r: YouTubeSearchResult, i: number, arr: YouTubeSearchResult[]) =>
          arr.findIndex((x) => x.youtubeVideoId === r.youtubeVideoId) === i,
      ));
      setNextPageToken(data.nextPageToken ?? null);
    } catch {
      setError("YouTube search is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (!nextPageToken || !query.trim()) return;
    setLoadingMore(true);
    try {
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query.trim())}&pageToken=${encodeURIComponent(nextPageToken)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "Failed to load more results.");
        return;
      }
      setResults((prev) => {
        const combined = [...prev, ...(data.results ?? [])];
        return combined.filter(
          (r: YouTubeSearchResult, i: number, arr: YouTubeSearchResult[]) =>
            arr.findIndex((x) => x.youtubeVideoId === r.youtubeVideoId) === i,
        );
      });
      setNextPageToken(data.nextPageToken ?? null);
    } catch {
      setError("Failed to load more results.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="mt-4">
        {activeTab === "search" ? (
          <>
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 pl-3.5 transition focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-brand/30"
            >
              <SearchIcon className="h-5 w-5 shrink-0 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search YouTube…"
                aria-label="Search YouTube"
                className="h-11 w-full min-w-0 flex-1 bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              <Button
                type="submit"
                className="shrink-0"
                disabled={loading || query.trim().length === 0}
              >
                Search
              </Button>
            </form>

            <div className="mt-4" aria-live="polite">
              {loading ? (
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <li key={i} className="flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                      <Skeleton className="aspect-video w-full rounded-none" />
                      <div className="space-y-2 p-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
              {!loading && error ? (
                <p className="text-sm text-red-400">{error}</p>
              ) : null}
              {!loading && !error && results.length === 0 ? (
                <EmptyState
                  icon={<SearchIcon className="h-8 w-8" />}
                  title="No results yet"
                  description="Search for a video to add to this module."
                />
              ) : null}
            </div>

            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <li
                  key={result.youtubeVideoId}
                  className="group flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
                    {result.thumbnailUrl ? (
                      <Image
                        src={result.thumbnailUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : null}
                    {result.durationSeconds ? (
                      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-zinc-100">
                        {formatDuration(result.durationSeconds)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <p className="line-clamp-2 text-sm font-medium text-zinc-100">
                      {result.title}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {result.channelName ?? "Unknown channel"}
                    </p>
                    <div className="mt-auto flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setPreview(result)}
                      >
                        Preview
                      </Button>
                      {existingVideoIds?.has(result.youtubeVideoId) ? (
                        <Button type="button" size="sm" variant="secondary" disabled>
                          <CheckIcon className="h-4 w-4" />
                          Already Added
                        </Button>
                      ) : (
                        <AddVideoButton
                          courseId={courseId}
                          moduleId={moduleId}
                          videoId={result.youtubeVideoId}
                        />
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {nextPageToken && (
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading…" : "Load More"}
                </Button>
              </div>
            )}
          </>
        ) : null}

        {activeTab === "url" ? (
          <UrlImportPanel courseId={courseId} moduleId={moduleId} />
        ) : null}

        {activeTab === "playlist" ? (
          <PlaylistImportPanel courseId={courseId} moduleId={moduleId} />
        ) : null}
      </div>

      {preview ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900 p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="mb-3 truncate text-sm font-semibold text-zinc-100">
              {preview.title}
            </h3>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${preview.youtubeVideoId}?autoplay=1&rel=0`}
              title={preview.title}
              className="aspect-video w-full rounded-md bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                {preview.channelName ?? "Unknown channel"}
                {formatDuration(preview.durationSeconds)
                  ? ` · ${formatDuration(preview.durationSeconds)}`
                  : ""}
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setPreview(null)}
                >
                  <CloseIcon className="h-4 w-4" />
                  Close
                </Button>
                <AddVideoButton
                  courseId={courseId}
                  moduleId={moduleId}
                  videoId={preview.youtubeVideoId}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
