"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { listLessonsByModule } from "@/features/lessons/lesson.queries";
import { listModulesByCourse } from "@/features/modules/module.queries";
import {
  COURSE_IMPORT_FORMAT,
  MAX_IMPORT_JSON_BYTES,
  courseIdSchema,
  courseImportSchema,
  parseCourseInput,
} from "./course.validation";
import {
  createCourse,
  createCourseWithModulesAndLessons,
  deleteCourse,
  updateCourse,
} from "./course.mutations";
import { getCourseById, getCourseByTitle } from "./course.queries";
import type { CourseActionState } from "./course.types";

export async function createCourseAction(
  _prevState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  const parsed = parseCourseInput(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  createCourse(getDb(), parsed.data);
  revalidatePath("/");
  return {};
}

export async function updateCourseAction(
  courseId: number,
  _prevState: CourseActionState,
  formData: FormData,
): Promise<CourseActionState> {
  const parsedId = courseIdSchema.safeParse(courseId);
  const parsed = parseCourseInput(formData);
  if (!parsedId.success) {
    return { error: "This course no longer exists." };
  }
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const course = updateCourse(getDb(), parsedId.data, parsed.data);
  if (!course) {
    return { error: "This course no longer exists." };
  }

  revalidatePath("/");
  revalidatePath(`/courses/${course.id}`);
  return {};
}

export async function deleteCourseAction(
  courseId: number,
): Promise<CourseActionState> {
  const parsedId = courseIdSchema.safeParse(courseId);
  if (!parsedId.success) {
    return { error: "This course no longer exists." };
  }

  const deleted = deleteCourse(getDb(), parsedId.data);
  if (!deleted) {
    return { error: "This course no longer exists." };
  }

  revalidatePath("/");
  redirect("/");
}

export type ExportCourseResult =
  | { ok: true; fileName: string; json: string }
  | { ok: false; error: string };

export async function exportCourseAction(
  courseId: number,
): Promise<ExportCourseResult> {
  const parsedId = courseIdSchema.safeParse(courseId);
  if (!parsedId.success) {
    return { ok: false, error: "This course no longer exists." };
  }

  const db = getDb();
  const course = getCourseById(db, parsedId.data);
  if (!course) {
    return { ok: false, error: "This course no longer exists." };
  }

  const modules = listModulesByCourse(db, course.id).map((module) => ({
    title: module.title,
    description: module.description,
    lessons: listLessonsByModule(db, module.id).map((lesson) => ({
      youtubeVideoId: lesson.youtube_video_id,
      title: lesson.youtube_title,
      channelId: lesson.youtube_channel_id,
      channelName: lesson.youtube_channel_name,
      thumbnailUrl: lesson.youtube_thumbnail_url,
      durationSeconds: lesson.youtube_duration,
      description: lesson.youtube_description,
      publishedAt: lesson.youtube_published_at?.toISOString() ?? null,
    })),
  }));

  const payload = {
    format: COURSE_IMPORT_FORMAT,
    version: 1,
    course: {
      title: course.title,
      description: course.description,
      goal: course.goal ?? undefined,
      modules,
    },
  };

  const safeName =
    course.title.trim().replace(/[^a-z0-9-_]+/gi, "-").toLowerCase().slice(0, 80) ||
    "course";

  return {
    ok: true,
    fileName: `${safeName}.studyforge-course.json`,
    json: JSON.stringify(payload, null, 2),
  };
}

export interface ImportCourseState {
  error?: string;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function hasSameOrderedModules(
  existingModuleTitles: string[],
  importedModules: { title: string }[],
): boolean {
  return (
    existingModuleTitles.length === importedModules.length &&
    existingModuleTitles.every(
      (title, index) =>
        title === normalizeName(importedModules[index].title),
    )
  );
}

export async function importCourseAction(
  _prevState: ImportCourseState,
  formData: FormData,
): Promise<ImportCourseState> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Choose a course file to import." };
  }
  if (file.size > MAX_IMPORT_JSON_BYTES) {
    return { error: "The file is too large. Course exports are small JSON files." };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { error: "The file could not be read." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "The file is not valid JSON." };
  }

  const validated = courseImportSchema.safeParse(parsed);
  if (!validated.success) {
    return { error: "The file is not a valid StudyForge course export." };
  }

  const db = getDb();
  const existing = getCourseByTitle(db, validated.data.course.title);
  if (existing) {
    const existingModuleTitles = listModulesByCourse(db, existing.id).map(
      (mod) => normalizeName(mod.title),
    );
    if (
      hasSameOrderedModules(
        existingModuleTitles,
        validated.data.course.modules,
      )
    ) {
      return {
        error: `A course named "${existing.title}" with the same modules already exists.`,
      };
    }
  }

  const { course, skippedDuplicates } = createCourseWithModulesAndLessons(
    db,
    validated.data.course,
  );

  revalidatePath("/");
  redirect(
    `/courses/${course.id}${skippedDuplicates ? `?imported=${skippedDuplicates}` : ""}`,
  );
}