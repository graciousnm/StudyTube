import type { LessonProgress } from "@/db/schema";
import type { LessonState, ProgressSummary } from "./progress.types";

type ProgressLike = Pick<
  LessonProgress,
  "completed" | "playback_position_seconds"
>;

export function getLessonState(
  progress: ProgressLike | null | undefined,
): LessonState {
  if (!progress) {
    return "not_started";
  }
  if (progress.completed) {
    return "completed";
  }
  if (progress.playback_position_seconds > 0) {
    return "in_progress";
  }
  return "not_started";
}

export function deriveProgress(
  completed: number,
  total: number,
): ProgressSummary {
  const safeTotal = Math.max(0, Math.trunc(total));
  if (safeTotal === 0) {
    return {
      completed: 0,
      total: 0,
      isEmpty: true,
      isComplete: false,
      percent: null,
    };
  }

  const safeCompleted = Math.min(Math.max(0, Math.trunc(completed)), safeTotal);
  return {
    completed: safeCompleted,
    total: safeTotal,
    isEmpty: false,
    isComplete: safeCompleted === safeTotal,
    percent: Math.round((safeCompleted / safeTotal) * 100),
  };
}

export function progressLabel(summary: ProgressSummary): string {
  if (summary.isEmpty) {
    return "No lessons yet";
  }
  return `${summary.completed} / ${summary.total} lessons complete`;
}

const LESSON_STATE_LABELS: Record<LessonState, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export function lessonStateLabel(state: LessonState): string {
  return LESSON_STATE_LABELS[state];
}

export function clampPlaybackPosition(
  position: number,
  durationSeconds: number | null | undefined,
): number {
  const floored = Math.floor(position);
  if (!Number.isFinite(floored) || floored < 0) {
    return 0;
  }
  if (durationSeconds && durationSeconds > 0 && floored > durationSeconds) {
    return Math.floor(durationSeconds);
  }
  return floored;
}

export function watchedPercent(
  progress: ProgressLike | null | undefined,
  durationSeconds: number | null | undefined,
): number | null {
  if (!progress || !durationSeconds || durationSeconds <= 0) {
    return null;
  }
  const percent = Math.round(
    (progress.playback_position_seconds / durationSeconds) * 100,
  );
  return Math.min(100, Math.max(0, percent));
}