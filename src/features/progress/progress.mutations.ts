import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { lessonProgress, type LessonProgress } from "@/db/schema";
import { clampPlaybackPosition } from "./progress.calculations";

export function getLessonProgress(
  db: Db,
  lessonId: number,
): LessonProgress | undefined {
  return db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.lesson_id, lessonId))
    .get();
}

export function savePlaybackPosition(
  db: Db,
  lessonId: number,
  position: number,
  durationSeconds: number | null = null,
): LessonProgress {
  const clamped = clampPlaybackPosition(position, durationSeconds);
  const now = new Date();
  const existing = getLessonProgress(db, lessonId);

  if (!existing) {
    return db
      .insert(lessonProgress)
      .values({
        lesson_id: lessonId,
        playback_position_seconds: clamped,
        completed: false,
        completed_at: null,
        created_at: now,
        updated_at: now,
      })
      .returning()
      .get();
  }

  return db
    .update(lessonProgress)
    .set({ playback_position_seconds: clamped, updated_at: now })
    .where(eq(lessonProgress.lesson_id, lessonId))
    .returning()
    .get();
}

export function markLessonComplete(db: Db, lessonId: number): LessonProgress {
  const now = new Date();
  const existing = getLessonProgress(db, lessonId);

  if (!existing) {
    return db
      .insert(lessonProgress)
      .values({
        lesson_id: lessonId,
        playback_position_seconds: 0,
        completed: true,
        completed_at: now,
        created_at: now,
        updated_at: now,
      })
      .returning()
      .get();
  }

  if (existing.completed) {
    return existing;
  }

  return db
    .update(lessonProgress)
    .set({ completed: true, completed_at: now, updated_at: now })
    .where(eq(lessonProgress.lesson_id, lessonId))
    .returning()
    .get();
}

export function markLessonIncomplete(
  db: Db,
  lessonId: number,
): LessonProgress | undefined {
  const existing = getLessonProgress(db, lessonId);
  if (!existing || !existing.completed) {
    return existing;
  }

  return db
    .update(lessonProgress)
    .set({ completed: false, completed_at: null, updated_at: new Date() })
    .where(eq(lessonProgress.lesson_id, lessonId))
    .returning()
    .get();
}