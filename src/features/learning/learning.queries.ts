import { asc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { lessons, modules } from "@/db/schema";
import { getCourseById } from "@/features/courses/course.queries";
import { getLessonInModule } from "@/features/lessons/lesson.queries";
import { getModuleInCourse } from "@/features/modules/module.queries";
import type { LearningContext, LessonNeighbour } from "./learning.types";

function lessonTitle(lesson: { youtube_title: string | null; youtube_video_id: string }): string {
  return lesson.youtube_title ?? lesson.youtube_video_id;
}

export function getLearningContext(
  db: Db,
  courseId: number,
  moduleId: number,
  lessonId: number,
): LearningContext | undefined {
  const course = getCourseById(db, courseId);
  if (!course) {
    return undefined;
  }

  const mod = getModuleInCourse(db, course.id, moduleId);
  if (!mod) {
    return undefined;
  }

  const lesson = getLessonInModule(db, mod.id, lessonId);
  if (!lesson) {
    return undefined;
  }

  const ordered = db
    .select({ lesson: lessons, module: modules })
    .from(lessons)
    .innerJoin(modules, eq(lessons.module_id, modules.id))
    .where(eq(modules.course_id, course.id))
    .orderBy(asc(modules.position), asc(lessons.position))
    .all();

  const index = ordered.findIndex((row) => row.lesson.id === lesson.id);

  const toNeighbour = (row: (typeof ordered)[number]): LessonNeighbour => ({
    courseId: row.module.course_id,
    moduleId: row.module.id,
    lessonId: row.lesson.id,
    title: lessonTitle(row.lesson),
  });

  const moduleLessons = ordered.filter((row) => row.module.id === mod.id);

  return {
    course,
    module: mod,
    lesson,
    lessonNumber: moduleLessons.findIndex((row) => row.lesson.id === lesson.id) + 1,
    lessonCount: moduleLessons.length,
    previous: index > 0 ? toNeighbour(ordered[index - 1]) : undefined,
    next: index >= 0 && index < ordered.length - 1
      ? toNeighbour(ordered[index + 1])
      : undefined,
  };
}