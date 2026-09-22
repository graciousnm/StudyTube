"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { getCourseById } from "@/features/courses/course.queries";
import { courseIdSchema } from "@/features/courses/course.validation";
import { learningPath } from "@/features/learning/learning.paths";
import { getLessonInModule } from "@/features/lessons/lesson.queries";
import { lessonIdSchema } from "@/features/lessons/lesson.validation";
import { getModuleInCourse } from "@/features/modules/module.queries";
import { moduleIdSchema } from "@/features/modules/module.validation";
import { deleteNote, saveNote } from "./notes.mutations";
import type { NoteActionState } from "./notes.types";
import { parseNoteInput } from "./notes.validation";

const LESSON_MISSING = "This lesson no longer exists.";

function resolveLesson(courseId: number, moduleId: number, lessonId: number) {
  const db = getDb();
  const course = getCourseById(db, courseId);
  if (!course) {
    return undefined;
  }
  const mod = getModuleInCourse(db, course.id, moduleId);
  if (!mod) {
    return undefined;
  }
  return getLessonInModule(db, mod.id, lessonId);
}

function parseLessonPath(courseId: number, moduleId: number, lessonId: number) {
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
  return {
    courseId: parsedCourseId.data,
    moduleId: parsedModuleId.data,
    lessonId: parsedLessonId.data,
  };
}

export async function saveNoteAction(
  courseId: number,
  moduleId: number,
  lessonId: number,
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const ids = parseLessonPath(courseId, moduleId, lessonId);
  if (!ids) {
    return { error: LESSON_MISSING };
  }

  const lesson = resolveLesson(ids.courseId, ids.moduleId, ids.lessonId);
  if (!lesson) {
    return { error: LESSON_MISSING };
  }

  const parsed = parseNoteInput(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  saveNote(getDb(), lesson.id, parsed.data.content);
  revalidatePath(learningPath(ids.courseId, ids.moduleId, ids.lessonId));
  return {};
}

export async function deleteNoteAction(
  courseId: number,
  moduleId: number,
  lessonId: number,
): Promise<NoteActionState> {
  const ids = parseLessonPath(courseId, moduleId, lessonId);
  if (!ids) {
    return { error: LESSON_MISSING };
  }

  const lesson = resolveLesson(ids.courseId, ids.moduleId, ids.lessonId);
  if (!lesson) {
    return { error: LESSON_MISSING };
  }

  deleteNote(getDb(), lesson.id);
  revalidatePath(learningPath(ids.courseId, ids.moduleId, ids.lessonId));
  return {};
}