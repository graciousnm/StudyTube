import { z } from "zod";
import type { CourseActionState } from "./course.types";

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
});

export const courseIdSchema = z.coerce.number().int().positive();

function readCourseInput(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description") ?? "",
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
    if (key === "title" || key === "description") {
      const messages = fieldErrors[key] ?? [];
      messages.push(issue.message);
      fieldErrors[key] = messages;
    }
  }
  return { success: false, fieldErrors };
}