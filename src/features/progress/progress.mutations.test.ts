import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DatabaseHandle, type Db } from "@/db/client";
import { lessonProgress } from "@/db/schema";
import { createCourse } from "@/features/courses/course.mutations";
import { createLesson } from "@/features/lessons/lesson.mutations";
import { createModule } from "@/features/modules/module.mutations";
import {
  getLessonProgress,
  markLessonComplete,
  markLessonIncomplete,
  savePlaybackPosition,
} from "./progress.mutations";

let db: Db;
let close: () => void;
let lessonId: number;

beforeEach(() => {
  const handle: DatabaseHandle = createDb(":memory:");
  migrate(handle.db, {
    migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
  });
  db = handle.db;
  close = handle.close;

  const course = createCourse(db, { title: "Course", description: "" });
  const mod = createModule(db, course.id, {
    title: "Module",
    description: "",
  });
  lessonId = createLesson(db, mod.id, {
    youtube_video_id: "aaaaaaaaaaa",
    youtube_title: "Lesson",
    youtube_duration: 600,
  }).id;
});

afterEach(() => {
  close();
});

function rows() {
  return db.select().from(lessonProgress).all();
}

describe("savePlaybackPosition", () => {
  it("creates a progress record without completing the lesson", () => {
    const progress = savePlaybackPosition(db, lessonId, 120, 600);

    expect(progress).toMatchObject({
      lesson_id: lessonId,
      playback_position_seconds: 120,
      completed: false,
      completed_at: null,
    });
    expect(rows()).toHaveLength(1);
  });

  it("updates an existing position without a duplicate record", () => {
    savePlaybackPosition(db, lessonId, 120, 600);
    savePlaybackPosition(db, lessonId, 240, 600);

    expect(rows()).toHaveLength(1);
    expect(getLessonProgress(db, lessonId)?.playback_position_seconds).toBe(240);
  });

  it("clamps invalid positions safely", () => {
    savePlaybackPosition(db, lessonId, -30, 600);
    expect(getLessonProgress(db, lessonId)?.playback_position_seconds).toBe(0);

    savePlaybackPosition(db, lessonId, 9999, 600);
    expect(getLessonProgress(db, lessonId)?.playback_position_seconds).toBe(600);
  });

  it("does not touch completion state", () => {
    const completed = markLessonComplete(db, lessonId);
    savePlaybackPosition(db, lessonId, 300, 600);

    const progress = getLessonProgress(db, lessonId);
    expect(progress?.completed).toBe(true);
    expect(progress?.completed_at).toEqual(completed.completed_at);
    expect(progress?.playback_position_seconds).toBe(300);
  });
});

describe("markLessonComplete", () => {
  it("creates a completed record with a completion timestamp", () => {
    const progress = markLessonComplete(db, lessonId);

    expect(progress.completed).toBe(true);
    expect(progress.completed_at).toBeInstanceOf(Date);
    expect(progress.playback_position_seconds).toBe(0);
  });

  it("completes a lesson that already has playback progress", () => {
    savePlaybackPosition(db, lessonId, 240, 600);
    const progress = markLessonComplete(db, lessonId);

    expect(progress.completed).toBe(true);
    expect(progress.playback_position_seconds).toBe(240);
  });

  it("is idempotent when the lesson is already complete", () => {
    const first = markLessonComplete(db, lessonId);
    const second = markLessonComplete(db, lessonId);

    expect(rows()).toHaveLength(1);
    expect(second.completed_at).toEqual(first.completed_at);
  });
});

describe("markLessonIncomplete", () => {
  it("clears completion but preserves playback position", () => {
    savePlaybackPosition(db, lessonId, 240, 600);
    markLessonComplete(db, lessonId);

    const progress = markLessonIncomplete(db, lessonId);
    expect(progress).toMatchObject({
      completed: false,
      completed_at: null,
      playback_position_seconds: 240,
    });
  });

  it("does nothing when the lesson is not completed", () => {
    savePlaybackPosition(db, lessonId, 240, 600);
    markLessonIncomplete(db, lessonId);

    expect(getLessonProgress(db, lessonId)).toMatchObject({
      completed: false,
      playback_position_seconds: 240,
    });
  });

  it("does nothing when there is no progress record", () => {
    expect(markLessonIncomplete(db, lessonId)).toBeUndefined();
    expect(rows()).toHaveLength(0);
  });
});