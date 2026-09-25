"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LayersIcon, PlusIcon } from "@/components/ui/icons";
import { extractPlaylistId } from "@/features/youtube/youtube.url";
import { addVideosToModuleAction } from "@/features/lessons/lesson.actions";
import type { YouTubeSearchResult } from "@/features/youtube/youtube.types";
import { formatDuration } from "@/lib/format";

interface PlaylistImportPanelProps {
  courseId: number;
  moduleId: number;
}

interface FetchState {
  loading: boolean;
  error: string | null;
  videos: YouTubeSearchResult[];
  nextPageToken: string | null;
  loadingMore: boolean;
}

interface AddState {
  adding: boolean;
  added: number;
  duplicates: number;
  errors: number;
  total: number;
  done: boolean;
}

export function PlaylistImportPanel({
  courseId,
  moduleId,
}: PlaylistImportPanelProps) {
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fetchState, setFetchState] = useState<FetchState>({
    loading: false,
    error: null,
    videos: [],
    nextPageToken: null,
    loadingMore: false,
  });
  const [addState, setAddState] = useState<AddState>({
    adding: false,
    added: 0,
    duplicates: 0,
    errors: 0,
    total: 0,
    done: false,
  });

  const playlistId = extractPlaylistId(url);

  const handleFetch = useCallback(async () => {
    if (!playlistId) return;

    setFetchState((s) => ({
      ...s,
      loading: true,
      error: null,
      videos: [],
      nextPageToken: null,
    }));
    setSelected(new Set());
    setAddState({
      adding: false,
      added: 0,
      duplicates: 0,
      errors: 0,
      total: 0,
      done: false,
    });

    try {
      const response = await fetch(
        `/api/youtube/playlist?id=${encodeURIComponent(playlistId)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setFetchState((s) => ({
          ...s,
          loading: false,
          error: data?.error ?? "Failed to load playlist.",
        }));
        return;
      }
      setFetchState((s) => ({
        ...s,
        loading: false,
        videos: data.items ?? [],
        nextPageToken: data.nextPageToken ?? null,
      }));
    } catch {
      setFetchState((s) => ({
        ...s,
        loading: false,
        error: "Failed to load playlist.",
      }));
    }
  }, [playlistId]);

  const handleLoadMore = useCallback(async () => {
    if (!playlistId || !fetchState.nextPageToken) return;

    setFetchState((s) => ({ ...s, loadingMore: true }));

    try {
      const response = await fetch(
        `/api/youtube/playlist?id=${encodeURIComponent(playlistId)}&pageToken=${encodeURIComponent(fetchState.nextPageToken)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setFetchState((s) => ({
          ...s,
          loadingMore: false,
          error: data?.error ?? "Failed to load more videos.",
        }));
        return;
      }
      setFetchState((s) => ({
        ...s,
        loadingMore: false,
        videos: [...s.videos, ...(data.items ?? [])],
        nextPageToken: data.nextPageToken ?? null,
      }));
    } catch {
      setFetchState((s) => ({
        ...s,
        loadingMore: false,
        error: "Failed to load more videos.",
      }));
    }
  }, [playlistId, fetchState.nextPageToken]);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === fetchState.videos.length) {
        return new Set();
      }
      return new Set(fetchState.videos.map((v) => v.youtubeVideoId));
    });
  }, [fetchState.videos]);

  const toggleOne = useCallback((videoId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  }, []);

  const handleAddSelected = useCallback(async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    setAddState({
      adding: true,
      added: 0,
      duplicates: 0,
      errors: 0,
      total: ids.length,
      done: false,
    });

    const result = await addVideosToModuleAction(courseId, moduleId, ids);

    setAddState({
      adding: false,
      added: result.added,
      duplicates: result.duplicates,
      errors: result.errors,
      total: ids.length,
      done: true,
    });

    if (result.added > 0) {
      toast.success(`${result.added} video${result.added === 1 ? "" : "s"} added to module`);
    }
    if (result.duplicates > 0) {
      toast.warning(`${result.duplicates} duplicate${result.duplicates === 1 ? "" : "s"} skipped`);
    }

    setSelected(new Set());
  }, [courseId, moduleId, selected]);

  const allSelected =
    fetchState.videos.length > 0 && selected.size === fetchState.videos.length;

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleFetch();
        }}
        className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 pl-3.5 transition focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-brand/30"
      >
        <LayersIcon className="h-5 w-5 shrink-0 text-zinc-500" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a YouTube playlist URL…"
          aria-label="YouTube playlist URL"
          className="h-11 w-full min-w-0 flex-1 bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
        <Button
          type="submit"
          className="shrink-0"
          disabled={!playlistId || fetchState.loading}
        >
          {fetchState.loading ? "Loading…" : "Fetch Playlist"}
        </Button>
      </form>

      {fetchState.error ? (
        <p role="alert" className="text-sm text-red-400">
          {fetchState.error}
        </p>
      ) : null}

      {addState.done ? (
        <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-zinc-100">
          Added {addState.added} video
          {addState.added !== 1 ? "s" : ""}.
          {addState.duplicates > 0
            ? ` ${addState.duplicates} duplicate${addState.duplicates !== 1 ? "s" : ""} skipped.`
            : ""}
          {addState.errors > 0
            ? ` ${addState.errors} failed.`
            : ""}
        </div>
      ) : null}

      {fetchState.videos.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              {fetchState.videos.length} video
              {fetchState.videos.length !== 1 ? "s" : ""}
              {selected.size > 0 ? ` · ${selected.size} selected` : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={toggleAll}
              >
                {allSelected ? "Deselect All" : "Select All"}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={selected.size === 0 || addState.adding}
                onClick={handleAddSelected}
              >
                <PlusIcon className="h-4 w-4" />
                {addState.adding
                  ? "Adding…"
                  : `Add Selected (${selected.size})`}
              </Button>
            </div>
          </div>

          <ul className="space-y-2">
            {fetchState.videos.map((video) => (
              <li
                key={video.youtubeVideoId}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3"
              >
                <input
                  type="checkbox"
                  checked={selected.has(video.youtubeVideoId)}
                  onChange={() => toggleOne(video.youtubeVideoId)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-brand focus:ring-brand/40"
                />
                <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded bg-zinc-800">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : null}
                  {video.durationSeconds ? (
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-zinc-100">
                      {formatDuration(video.durationSeconds)}
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-zinc-100">
                    {video.title}
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    {video.channelName ?? "Unknown channel"}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {fetchState.nextPageToken ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="secondary"
                disabled={fetchState.loadingMore}
                onClick={handleLoadMore}
              >
                {fetchState.loadingMore ? "Loading…" : "Load More"}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {!fetchState.loading && !fetchState.error && fetchState.videos.length === 0 && !addState.done ? (
        <p className="text-sm text-zinc-500">
          Paste a playlist URL and click Fetch to see videos.
        </p>
      ) : null}
    </div>
  );
}
