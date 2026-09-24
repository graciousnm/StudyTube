import { count, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import {
  courses,
  lessonProgress,
  lessons,
  modules,
  profile,
  type Profile,
} from "@/db/schema";
import { listCourses } from "@/features/courses/course.queries";
import { deriveProgress } from "@/features/progress/progress.calculations";
import { getCourseProgressMap } from "@/features/progress/progress.queries";
import type {
  CourseProgressEntry,
  LearnerStats,
  RecentlyStudiedCourse,
} from "./profile.types";

export function getProfile(db: Db): Profile | undefined {
  return db.select().from(profile).where(eq(profile.id, 1)).get();
}

export function getRecentlyStudiedCourses(
  db: Db,
  limit = 3,
): RecentlyStudiedCourse[] {
  const rows = db
    .select({
      course: courses,
      lastStudiedAt: sql<number>`max(${lessonProgress.updated_at})`,
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lesson_id, lessons.id))
    .innerJoin(modules, eq(lessons.module_id, modules.id))
    .innerJoin(courses, eq(modules.course_id, courses.id))
    .groupBy(courses.id)
    .orderBy(desc(sql`max(${lessonProgress.updated_at})`))
    .limit(limit)
    .all();

  return rows.map((row) => ({
    course: row.course,
    lastStudiedAt: row.lastStudiedAt,
  }));
}

export function getLearnerStats(db: Db): LearnerStats {
  const totals = db
    .select({
      totalLessons: count(lessons.id),
      completedLessons: sql<number>`coalesce(sum(case when ${lessonProgress.completed} = 1 then 1 else 0 end), 0)`,
      inProgressLessons: sql<number>`coalesce(sum(case when ${lessonProgress.completed} = 0 and ${lessonProgress.playback_position_seconds} > 0 then 1 else 0 end), 0)`,
    })
    .from(lessons)
    .leftJoin(lessonProgress, eq(lessonProgress.lesson_id, lessons.id))
    .get();

  const totalLessons = Number(totals?.totalLessons ?? 0);
  const completedLessons = Number(totals?.completedLessons ?? 0);
  const inProgressLessons = Number(totals?.inProgressLessons ?? 0);
  const notStartedLessons = Math.max(0, totalLessons - completedLessons - inProgressLessons);

  const overall = deriveProgress(completedLessons, totalLessons);

  const worked = db
    .select({
      seconds: sql<number>`coalesce(sum(${lessons.youtube_duration}), 0)`,
    })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lesson_id, lessons.id))
    .where(eq(lessonProgress.completed, true))
    .get();
  const workedMinutes = Math.floor(Number(worked?.seconds ?? 0) / 60);

  const touchedRows = db
    .select({ touchedAt: lessonProgress.updated_at })
    .from(lessonProgress)
    .all();
  const daysTouched = new Set(
    touchedRows.map((row) => row.touchedAt.toISOString().slice(0, 10)),
  ).size;

  const courseProgress = getCourseProgressMap(db);
  const courseEntries: CourseProgressEntry[] = listCourses(db).map((course) => {
    const progress = courseProgress.get(course.id) ?? deriveProgress(0, 0);
    const state: CourseProgressEntry["state"] = progress.isComplete
      ? "completed"
      : progress.completed > 0
        ? "in_progress"
        : "not_started";
    return { courseId: course.id, title: course.title, state, progress };
  });

  const inProgressEntries = courseEntries.filter(
    (entry) => entry.state === "in_progress",
  );
  const mostInProgress = inProgressEntries.sort(
    (a, b) =>
      (b.progress.percent ?? -1) - (a.progress.percent ?? -1) ||
      a.courseId - b.courseId,
  )[0];

  const mostCurrent = db
    .select({ courseId: courses.id, title: courses.title })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lesson_id, lessons.id))
    .innerJoin(modules, eq(lessons.module_id, modules.id))
    .innerJoin(courses, eq(modules.course_id, courses.id))
    .orderBy(desc(lessonProgress.updated_at))
    .limit(1)
    .get();

  return {
    totalLessons,
    completedLessons,
    inProgressLessons,
    notStartedLessons,
    percent: overall.percent,
    overallComplete: overall.isComplete,
    workedMinutes,
    daysTouched,
    courseEntries,
    mostInProgress,
    mostCurrent: mostCurrent ?? undefined,
  };
}