"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { createCourse, deleteCourse, updateCourse } from "./course.mutations";
import type { CourseActionState } from "./course.types";
import { courseIdSchema, parseCourseInput } from "./course.validation";

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
  const parsed = parseCourseInput(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const course = updateCourse(getDb(), courseId, parsed.data);
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