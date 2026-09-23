import { asc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { courses, lessons, modules, type Course } from "@/db/schema";

export function listCourses(db: Db): Course[] {
  return db.select().from(courses).orderBy(asc(courses.created_at)).all();
}

export function getCourseById(db: Db, id: number): Course | undefined {
  return db.select().from(courses).where(eq(courses.id, id)).get();
}

export function getFirstLessonThumbnails(db: Db): Map<number, string | null> {
  const rows = db
    .select({
      courseId: courses.id,
      thumbnailUrl: lessons.youtube_thumbnail_url,
    })
    .from(courses)
    .leftJoin(modules, eq(modules.course_id, courses.id))
    .leftJoin(lessons, eq(lessons.module_id, modules.id))
    .orderBy(asc(courses.id), asc(modules.position), asc(lessons.position))
    .all();

  const map = new Map<number, string | null>();
  for (const row of rows) {
    if (!map.has(row.courseId)) {
      map.set(row.courseId, row.thumbnailUrl);
    }
  }
  return map;
}