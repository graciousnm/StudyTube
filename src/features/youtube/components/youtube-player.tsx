"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadYouTubeIframeApi,
  YouTubePlayerState,
  type YouTubePlayerInstance,
} from "@/features/youtube/youtube.player";

const PROGRESS_INTERVAL_MS = 10_000;

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  startSeconds?: number;
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
}

export function YouTubePlayer({
  videoId,
  title,
  startSeconds = 0,
  onProgress,
  onEnded,
}: YouTubePlayerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(onProgress);
  const endedRef = useRef(onEnded);
  const playerRef = useRef<YouTubePlayerInstance | undefined>(undefined);
  const readyRef = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    progressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    endedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    function report() {
      const p = playerRef.current;
      if (!p) return;
      const seconds = p.getCurrentTime();
      if (!Number.isFinite(seconds)) return;
      const duration = p.getDuration();
      progressRef.current?.(seconds, Number.isFinite(duration) ? duration : 0);
    }

    const host = document.createElement("div");
    host.className = "h-full w-full";
    wrapper.appendChild(host);

    readyRef.current = false;
    playerRef.current = undefined;

    void loadYouTubeIframeApi().then((api) => {
      if (cancelled) return;

      const player = new api.Player(host, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          start: Math.max(0, Math.floor(startSeconds)),
        },
        events: {
          onReady: () => {
            const iframe = player?.getIframe?.();
            if (iframe) {
              iframe.title = title;
            }
            readyRef.current = true;
            playerRef.current = player;
            if (startSeconds > 0) {
              player?.seekTo(startSeconds, true);
            }
          },
          onError: () => {
            if (!cancelled) setError(true);
          },
          onStateChange: (event) => {
            if (
              event.data === YouTubePlayerState.paused ||
              event.data === YouTubePlayerState.ended ||
              event.data === YouTubePlayerState.cued
            ) {
              report();
            }

            if (event.data === YouTubePlayerState.ended) {
              endedRef.current?.();
            }

            if (event.data === YouTubePlayerState.playing) {
              if (interval) clearInterval(interval);
              interval = setInterval(report, PROGRESS_INTERVAL_MS);
            } else if (interval) {
              clearInterval(interval);
              interval = undefined;
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      report();
      playerRef.current?.destroy();
      playerRef.current = undefined;
      readyRef.current = false;
      host.remove();
    };
  }, [videoId, title]);

  useEffect(() => {
    if (readyRef.current && playerRef.current && startSeconds > 0) {
      playerRef.current.seekTo(startSeconds, true);
    }
  }, [startSeconds]);

  if (error) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-zinc-200">
            This video is unavailable
          </p>
          <p className="text-xs text-zinc-500">
            The video may have been removed or is restricted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      data-testid="youtube-player"
      data-video-id={videoId}
      aria-label={title}
      className="aspect-video w-full overflow-hidden rounded-xl bg-black"
    />
  );
}
