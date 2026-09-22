import { asc, count, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { lessons, modules, type Module } from "@/db/schema";

export function listModulesByCourse(db: Db, courseId: number): Module[] {
  return db
    .select()
    .from(modules)
    .where(eq(modules.course_id, courseId))
    .orderBy(asc(modules.position))
    .all();
}

export function getModuleById(db: Db, id: number): Module | undefined {
  return db.select().from(modules).where(eq(modules.id, id)).get();
}

export function getModuleInCourse(
  db: Db,
  courseId: number,
  moduleId: number,
): Module | undefined {
  const found = getModuleById(db, moduleId);
  return found && found.course_id === courseId ? found : undefined;
}

export function countLessonsByModule(
  db: Db,
  courseId: number,
): Map<number, number> {
  const rows = db
    .select({ module_id: lessons.module_id, total: count() })
    .from(lessons)
    .innerJoin(modules, eq(lessons.module_id, modules.id))
    .where(eq(modules.course_id, courseId))
    .groupBy(lessons.module_id)
    .all();

  return new Map(rows.map((row) => [row.module_id, row.total]));
}
