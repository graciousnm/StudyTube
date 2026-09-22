import { and, asc, count, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import {
  courses,
  lessonProgress,
  lessons,
  modules,
  type LessonProgress,
} from "@/db/schema";
import { deriveProgress } from "./progress.calculations";
import type { ContinueLearning, ProgressSummary } from "./progress.types";

const completedCount = sql<number>`coalesce(sum(case when ${lessonProgress.completed} = 1 then 1 else 0 end), 0)`;

export function getLessonProgressMap(
  db: Db,
  moduleId: number,
): Map<number, LessonProgress> {
  const rows = db
    .select({ progress: lessonProgress })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lesson_id, lessons.id))
    .where(eq(lessons.module_id, moduleId))
    .all();

  return new Map(rows.map((row) => [row.progress.lesson_id, row.progress]));
}

export function getCourseProgress(
  db: Db,
  courseId: number,
): ProgressSummary {
  const row = db
    .select({ total: count(lessons.id), completed: completedCount })
    .from(lessons)
    .innerJoin(modules, eq(lessons.module_id, modules.id))
    .leftJoin(lessonProgress, eq(lessonProgress.lesson_id, lessons.id))
    .where(eq(modules.course_id, courseId))
    .get();

  return deriveProgress(Number(row?.completed ?? 0), Number(row?.total ?? 0));
}

export function getModuleProgress(
  db: Db,
  moduleId: number,
): ProgressSummary {
  const row = db
    .select({ total: count(lessons.id), completed: completedCount })
    .from(lessons)
    .leftJoin(lessonProgress, eq(lessonProgress.lesson_id, lessons.id))
    .where(eq(lessons.module_id, moduleId))
    .get();

  return deriveProgress(Number(row?.completed ?? 0), Number(row?.total ?? 0));
}

export function getCourseProgressMap(db: Db): Map<number, ProgressSummary> {
  const rows = db
    .select({
      course_id: modules.course_id,
      total: count(lessons.id),
      completed: completedCount,
    })
    .from(modules)
    .leftJoin(lessons, eq(lessons.module_id, modules.id))
    .leftJoin(lessonProgress, eq(lessonProgress.lesson_id, lessons.id))
    .groupBy(modules.course_id)
    .all();

  return new Map(
    rows.map((row) => [
      row.course_id,
      deriveProgress(Number(row.completed), Number(row.total)),
    ]),
  );
}

export function getModuleProgressMap(
  db: Db,
  courseId: number,
): Map<number, ProgressSummary> {
  const rows = db
    .select({
      module_id: lessons.module_id,
      total: count(lessons.id),
      completed: completedCount,
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.module_id, modules.id))
    .leftJoin(lessonProgress, eq(lessonProgress.lesson_id, lessons.id))
    .where(eq(modules.course_id, courseId))
    .groupBy(lessons.module_id)
    .all();

  return new Map(
    rows.map((row) => [
      row.module_id,
      deriveProgress(Number(row.completed), Number(row.total)),
    ]),
  );
}

export function getContinueLearning(
  db: Db,
  options: { courseId?: number; moduleId?: number } = {},
): ContinueLearning | undefined {
  const courseFilter = options.courseId
    ? eq(modules.course_id, options.courseId)
    : undefined;
  const moduleFilter = options.moduleId
    ? eq(lessons.module_id, options.moduleId)
    : undefined;

  const recent = db
    .select({
      course: courses,
      module: modules,
      lesson: lessons,
      progress: lessonProgress,
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lesson_id, lessons.id))
    .innerJoin(modules, eq(lessons.module_id, modules.id))
    .innerJoin(courses, eq(modules.course_id, courses.id))
    .where(
      and(
        eq(lessonProgress.completed, false),
        gt(lessonProgress.playback_position_seconds, 0),
        courseFilter,
        moduleFilter,
      ),
    )
    .orderBy(desc(lessonProgress.updated_at))
    .limit(1)
    .get();

  if (recent) {
    return { ...recent, started: true };
  }

  const fallback = db
    .select({
      course: courses,
      module: modules,
      lesson: lessons,
      progress: lessonProgress,
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.module_id, modules.id))
    .innerJoin(courses, eq(modules.course_id, courses.id))
    .leftJoin(lessonProgress, eq(lessonProgress.lesson_id, lessons.id))
    .where(
      and(
        or(isNull(lessonProgress.completed), eq(lessonProgress.completed, false)),
        courseFilter,
        moduleFilter,
      ),
    )
    .orderBy(asc(courses.id), asc(modules.position), asc(lessons.position))
    .limit(1)
    .get();

  if (!fallback) {
    return undefined;
  }

  return { ...fallback, started: false };
}