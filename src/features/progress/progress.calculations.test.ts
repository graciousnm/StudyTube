import { describe, expect, it } from "vitest";
import {
  clampPlaybackPosition,
  deriveProgress,
  getLessonState,
  lessonStateLabel,
  progressLabel,
  watchedPercent,
} from "./progress.calculations";

describe("deriveProgress", () => {
  it("returns an empty state for a course with no lessons", () => {
    const summary = deriveProgress(0, 0);
    expect(summary).toEqual({
      completed: 0,
      total: 0,
      isEmpty: true,
      isComplete: false,
      percent: null,
    });
    expect(summary.percent).toBeNull();
  });

  it("calculates percentages from exact counts", () => {
    expect(deriveProgress(0, 5)).toMatchObject({ percent: 0, isComplete: false });
    expect(deriveProgress(1, 5)).toMatchObject({ percent: 20 });
    expect(deriveProgress(4, 5)).toMatchObject({ percent: 80 });
    expect(deriveProgress(5, 5)).toMatchObject({
      percent: 100,
      isComplete: true,
    });
  });

  it("rounds percentages for display", () => {
    expect(deriveProgress(2, 3).percent).toBe(67);
    expect(deriveProgress(7, 12).percent).toBe(58);
  });

  it("never lets completed exceed total or go negative", () => {
    expect(deriveProgress(9, 5)).toMatchObject({ completed: 5, total: 5 });
    expect(deriveProgress(-3, 5)).toMatchObject({ completed: 0, total: 5 });
  });

  it("treats a negative total as empty", () => {
    expect(deriveProgress(2, -1).isEmpty).toBe(true);
  });
});

describe("getLessonState", () => {
  it("treats a missing record as not started", () => {
    expect(getLessonState(undefined)).toBe("not_started");
    expect(getLessonState(null)).toBe("not_started");
    expect(
      getLessonState({ completed: false, playback_position_seconds: 0 }),
    ).toBe("not_started");
  });

  it("treats saved playback as in progress", () => {
    expect(
      getLessonState({ completed: false, playback_position_seconds: 42 }),
    ).toBe("in_progress");
  });

  it("treats completed as completed", () => {
    expect(
      getLessonState({ completed: true, playback_position_seconds: 0 }),
    ).toBe("completed");
    expect(
      getLessonState({ completed: true, playback_position_seconds: 900 }),
    ).toBe("completed");
  });
});

describe("lessonStateLabel", () => {
  it("describes each state", () => {
    expect(lessonStateLabel("not_started")).toBe("Not started");
    expect(lessonStateLabel("in_progress")).toBe("In progress");
    expect(lessonStateLabel("completed")).toBe("Completed");
  });
});

describe("progressLabel", () => {
  it("shows an empty state instead of a misleading percentage", () => {
    expect(progressLabel(deriveProgress(0, 0))).toBe("No lessons yet");
  });

  it("shows counts for a course with lessons", () => {
    expect(progressLabel(deriveProgress(4, 6))).toBe("4 / 6 lessons complete");
  });
});

describe("clampPlaybackPosition", () => {
  it("floors fractional positions", () => {
    expect(clampPlaybackPosition(12.9, null)).toBe(12);
  });

  it("never returns a negative position", () => {
    expect(clampPlaybackPosition(-5, null)).toBe(0);
    expect(clampPlaybackPosition(-5, 100)).toBe(0);
  });

  it("clamps to a known duration", () => {
    expect(clampPlaybackPosition(500, 120)).toBe(120);
    expect(clampPlaybackPosition(90, 120)).toBe(90);
  });

  it("does not clamp when duration is unknown", () => {
    expect(clampPlaybackPosition(500, null)).toBe(500);
    expect(clampPlaybackPosition(500, undefined)).toBe(500);
    expect(clampPlaybackPosition(500, 0)).toBe(500);
  });

  it("treats non-finite values as zero", () => {
    expect(clampPlaybackPosition(Number.NaN, 100)).toBe(0);
    expect(clampPlaybackPosition(Number.POSITIVE_INFINITY, 100)).toBe(0);
  });
});

describe("watchedPercent", () => {
  it("returns null when duration is unknown", () => {
    expect(
      watchedPercent({ completed: false, playback_position_seconds: 30 }, null),
    ).toBeNull();
    expect(
      watchedPercent({ completed: false, playback_position_seconds: 30 }, 0),
    ).toBeNull();
    expect(watchedPercent(undefined, 100)).toBeNull();
  });

  it("calculates a watched percentage", () => {
    expect(
      watchedPercent({ completed: false, playback_position_seconds: 50 }, 100),
    ).toBe(50);
    expect(
      watchedPercent({ completed: false, playback_position_seconds: 1 }, 3),
    ).toBe(33);
  });

  it("never exceeds 100 percent", () => {
    expect(
      watchedPercent({ completed: false, playback_position_seconds: 250 }, 100),
    ).toBe(100);
  });
});