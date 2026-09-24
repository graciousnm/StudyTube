"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  loadYouTubeIframeApi,
  YouTubePlayerState,
  type YouTubePlayerInstance,
} from "@/features/youtube/youtube.player";

const PROGRESS_INTERVAL_MS = 10_000;
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SPEED_STORAGE_KEY = "studytube-playback-speed";

function getStoredSpeed(): number {
  if (typeof window === "undefined") return 1;
  try {
    const stored = localStorage.getItem(SPEED_STORAGE_KEY);
    if (stored) {
      const num = Number(stored);
      if (PLAYBACK_SPEEDS.includes(num)) return num;
    }
  } catch {}
  return 1;
}

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  startSeconds?: number;
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
}

export interface YouTubePlayerHandle {
  seekTo: (seconds: number) => void;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  function YouTubePlayer(
    {
      videoId,
      title,
      startSeconds = 0,
      onProgress,
      onEnded,
    }: YouTubePlayerProps,
    ref,
  ) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef(onProgress);
    const endedRef = useRef(onEnded);
    const startSecondsRef = useRef(startSeconds);
    const playerRef = useRef<YouTubePlayerInstance | undefined>(undefined);
    const readyRef = useRef(false);
    const [error, setError] = useState(false);
    const [playbackRate, setPlaybackRate] = useState<number>(getStoredSpeed);
    const playbackRateRef = useRef(playbackRate);

    useEffect(() => {
      progressRef.current = onProgress;
    }, [onProgress]);

    useEffect(() => {
      endedRef.current = onEnded;
    }, [onEnded]);

    useEffect(() => {
      startSecondsRef.current = startSeconds;
    }, [startSeconds]);

    useEffect(() => {
      playbackRateRef.current = playbackRate;
    }, [playbackRate]);

    useImperativeHandle(
      ref,
      () => ({
        seekTo: (seconds: number) => {
          const player = playerRef.current;
          if (!player || !readyRef.current) return;
          const duration = player.getDuration();
          const clamped = Number.isFinite(duration)
            ? Math.min(Math.max(0, seconds), Math.max(duration, 0))
            : Math.max(0, seconds);
          player.seekTo(clamped, true);
        },
      }),
      [],
    );

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
            start: Math.max(0, Math.floor(startSecondsRef.current)),
          },
          events: {
            onReady: () => {
              const iframe = player?.getIframe?.();
              if (iframe) {
                iframe.title = title;
              }
              readyRef.current = true;
              playerRef.current = player;
              if (startSecondsRef.current > 0) {
                player?.seekTo(startSecondsRef.current, true);
              }
              player?.setPlaybackRate(playbackRateRef.current);
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
      if (readyRef.current && playerRef.current) {
        playerRef.current.setPlaybackRate(playbackRate);
        try {
          localStorage.setItem(SPEED_STORAGE_KEY, String(playbackRate));
        } catch {}
      }
    }, [playbackRate]);

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
      <div className="space-y-2">
        <div
          ref={wrapperRef}
          data-testid="youtube-player"
          data-video-id={videoId}
          aria-label={title}
          className="aspect-video w-full overflow-hidden rounded-xl bg-black"
        />
        <div className="flex items-center gap-2">
          <label htmlFor="playback-speed" className="text-xs text-zinc-400">
            Speed
          </label>
          <select
            id="playback-speed"
            value={playbackRate}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:border-brand focus:outline-none"
          >
            {PLAYBACK_SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  },
);