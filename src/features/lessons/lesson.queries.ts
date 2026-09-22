import { and, asc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { lessons, type Lesson } from "@/db/schema";

export function listLessonsByModule(db: Db, moduleId: number): Lesson[] {
  return db
    .select()
    .from(lessons)
    .where(eq(lessons.module_id, moduleId))
    .orderBy(asc(lessons.position))
    .all();
}

export function getLessonById(db: Db, id: number): Lesson | undefined {
  return db.select().from(lessons).where(eq(lessons.id, id)).get();
}

export function getLessonInModule(
  db: Db,
  moduleId: number,
  lessonId: number,
): Lesson | undefined {
  const found = getLessonById(db, lessonId);
  return found && found.module_id === moduleId ? found : undefined;
}

export function findLessonByVideoId(
  db: Db,
  moduleId: number,
  youtubeVideoId: string,
): Lesson | undefined {
  return db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.module_id, moduleId),
        eq(lessons.youtube_video_id, youtubeVideoId),
      ),
    )
    .get();
}
