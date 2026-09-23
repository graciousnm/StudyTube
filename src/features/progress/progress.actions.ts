"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getCourseById } from "@/features/courses/course.queries";
import { courseIdSchema } from "@/features/courses/course.validation";
import { getLessonById, getLessonInModule } from "@/features/lessons/lesson.queries";
import { lessonIdSchema } from "@/features/lessons/lesson.validation";
import { getModuleInCourse } from "@/features/modules/module.queries";
import { moduleIdSchema } from "@/features/modules/module.validation";
import {
  markLessonComplete,
  markLessonIncomplete,
  savePlaybackPosition,
} from "./progress.mutations";
import type { ProgressActionState } from "./progress.types";
import {
  lessonCompletionInputSchema,
  playbackPositionInputSchema,
} from "./progress.validation";

function resolveLesson(courseId: number, moduleId: number, lessonId: number) {
  const parsedCourseId = courseIdSchema.safeParse(courseId);
  const parsedModuleId = moduleIdSchema.safeParse(moduleId);
  const parsedLessonId = lessonIdSchema.safeParse(lessonId);
  if (
    !parsedCourseId.success ||
    !parsedModuleId.success ||
    !parsedLessonId.success
  ) {
    return undefined;
  }

  const db = getDb();
  const course = getCourseById(db, parsedCourseId.data);
  if (!course) {
    return undefined;
  }

  const mod = getModuleInCourse(db, course.id, parsedModuleId.data);
  if (!mod) {
    return undefined;
  }

  const lesson = getLessonInModule(db, mod.id, parsedLessonId.data);
  if (!lesson) {
    return undefined;
  }

  return { db, course, mod, lesson };
}

function revalidateProgress(courseId: number, moduleId: number): void {
  revalidatePath("/");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}/modules/${moduleId}`);
}

export async function setLessonCompletedAction(
  courseId: number,
  moduleId: number,
  lessonId: number,
  completed: boolean,
): Promise<ProgressActionState> {
  const parsed = lessonCompletionInputSchema.safeParse({ lessonId, completed });
  if (!parsed.success) {
    return { error: "Invalid completion request." };
  }

  const resolved = resolveLesson(courseId, moduleId, lessonId);
  if (!resolved) {
    return { error: "This lesson no longer exists." };
  }

  const { db, course, mod, lesson } = resolved;
  if (parsed.data.completed) {
    markLessonComplete(db, lesson.id);
  } else {
    markLessonIncomplete(db, lesson.id);
  }

  revalidateProgress(course.id, mod.id);
  return { success: true };
}

export async function savePlaybackPositionAction(
  lessonId: number,
  position: number,
  duration: number | null,
): Promise<ProgressActionState> {
  const parsed = playbackPositionInputSchema.safeParse({
    lessonId,
    position,
    duration,
  });
  if (!parsed.success) {
    return { error: "Invalid playback position." };
  }

  const db = getDb();
  const lesson = getLessonById(db, parsed.data.lessonId);
  if (!lesson) {
    return { error: "This lesson no longer exists." };
  }

  savePlaybackPosition(db, lesson.id, parsed.data.position, parsed.data.duration ?? null);
  return { success: true };
}