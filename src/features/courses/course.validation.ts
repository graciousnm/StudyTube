import { z } from "zod";
import {
  youtubeThumbnailUrlSchema,
  youtubeVideoIdSchema,
} from "@/features/youtube/youtube.validation";
import type { CourseActionState } from "./course.types";

export const COURSE_IMPORT_FORMAT = "studyforge-course" as const;
export const MAX_IMPORT_MODULES = 50;
export const MAX_IMPORT_LESSONS_PER_MODULE = 200;
export const MAX_IMPORT_JSON_BYTES = 5 * 1024 * 1024;

export const courseInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title must be 200 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be 5,000 characters or fewer.")
    .default(""),
  goal: z
    .string()
    .trim()
    .max(500, "Learning goal must be 500 characters or fewer.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const courseIdSchema = z.coerce.number().int().positive();

function readCourseInput(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    goal: formData.get("goal") ?? "",
  };
}

export function parseCourseInput(
  formData: FormData,
):
  | { success: true; data: z.infer<typeof courseInputSchema> }
  | {
      success: false;
      fieldErrors: NonNullable<CourseActionState["fieldErrors"]>;
    } {
  const parsed = courseInputSchema.safeParse(readCourseInput(formData));
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  const fieldErrors: NonNullable<CourseActionState["fieldErrors"]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (key === "title" || key === "description" || key === "goal") {
      const messages = fieldErrors[key] ?? [];
      messages.push(issue.message);
      fieldErrors[key] = messages;
    }
  }
  return { success: false, fieldErrors };
}

const importedLessonSchema = z.object({
  youtubeVideoId: youtubeVideoIdSchema,
  title: z
    .string()
    .trim()
    .max(200, "Lesson title must be 200 characters or fewer.")
    .nullable()
    .optional(),
  channelId: z.string().trim().max(200).nullable().optional(),
  channelName: z.string().trim().max(200).nullable().optional(),
  thumbnailUrl: youtubeThumbnailUrlSchema.nullable().optional(),
  durationSeconds: z.number().int().min(0).max(86_400).nullable().optional(),
  description: z
    .string()
    .trim()
    .max(5000, "Lesson description must be 5,000 characters or fewer.")
    .nullable()
    .optional(),
  publishedAt: z.string().trim().nullable().optional(),
});

const importedModuleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Module title is required.")
    .max(200, "Module title must be 200 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(5000, "Module description must be 5,000 characters or fewer.")
    .default(""),
  lessons: z
    .array(importedLessonSchema)
    .max(
      MAX_IMPORT_LESSONS_PER_MODULE,
      `A module can have at most ${MAX_IMPORT_LESSONS_PER_MODULE} lessons.`,
    ),
});

export const courseImportSchema = z.object({
  format: z.literal(COURSE_IMPORT_FORMAT),
  version: z.number().int().positive(),
  course: courseInputSchema.extend({
    modules: z
      .array(importedModuleSchema)
      .max(
        MAX_IMPORT_MODULES,
        `A course can have at most ${MAX_IMPORT_MODULES} modules.`,
      ),
  }),
});

export type CourseImport = z.infer<typeof courseImportSchema>;
export type ImportedLesson = z.infer<typeof importedLessonSchema>;
export type ImportedModule = z.infer<typeof importedModuleSchema>;