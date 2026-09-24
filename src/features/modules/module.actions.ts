"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { getCourseById } from "@/features/courses/course.queries";
import { courseIdSchema } from "@/features/courses/course.validation";
import {
  createModule,
  deleteModule,
  moveModule,
  reorderModules,
  updateModule,
} from "./module.mutations";
import { getModuleInCourse, listModulesByCourse } from "./module.queries";
import type { ModuleActionState, MoveDirection } from "./module.types";
import { moduleIdSchema, parseModuleInput } from "./module.validation";

export async function createModuleAction(
  courseId: number,
  _prevState: ModuleActionState,
  formData: FormData,
): Promise<ModuleActionState> {
  const parsedId = courseIdSchema.safeParse(courseId);
  if (!parsedId.success) {
    return { error: "This course no longer exists." };
  }

  const course = getCourseById(getDb(), parsedId.data);
  if (!course) {
    return { error: "This course no longer exists." };
  }

  const parsed = parseModuleInput(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  createModule(getDb(), course.id, parsed.data);
  revalidatePath(`/courses/${course.id}`);
  return {};
}

export async function updateModuleAction(
  moduleId: number,
  _prevState: ModuleActionState,
  formData: FormData,
): Promise<ModuleActionState> {
  const parsedId = moduleIdSchema.safeParse(moduleId);
  if (!parsedId.success) {
    return { error: "This module no longer exists." };
  }

  const parsed = parseModuleInput(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const updated = updateModule(getDb(), parsedId.data, parsed.data);
  if (!updated) {
    return { error: "This module no longer exists." };
  }

  const path = `/courses/${updated.course_id}/modules/${updated.id}`;
  revalidatePath(`/courses/${updated.course_id}`);
  revalidatePath(path);
  return {};
}

export async function deleteModuleAction(
  courseId: number,
  moduleId: number,
): Promise<ModuleActionState> {
  const parsedCourseId = courseIdSchema.safeParse(courseId);
  const parsedModuleId = moduleIdSchema.safeParse(moduleId);
  if (!parsedCourseId.success || !parsedModuleId.success) {
    return { error: "This module no longer exists." };
  }

  const mod = getModuleInCourse(
    getDb(),
    parsedCourseId.data,
    parsedModuleId.data,
  );
  if (!mod) {
    return { error: "This module no longer exists." };
  }

  deleteModule(getDb(), mod.id);
  revalidatePath(`/courses/${mod.course_id}`);
  redirect(`/courses/${mod.course_id}`);
}

export async function moveModuleAction(
  courseId: number,
  moduleId: number,
  direction: MoveDirection,
): Promise<void> {
  if (direction !== "up" && direction !== "down") {
    return;
  }

  const parsedCourseId = courseIdSchema.safeParse(courseId);
  const parsedModuleId = moduleIdSchema.safeParse(moduleId);
  if (!parsedCourseId.success || !parsedModuleId.success) {
    return;
  }

  const mod = getModuleInCourse(
    getDb(),
    parsedCourseId.data,
    parsedModuleId.data,
  );
  if (!mod) {
    return;
  }

  moveModule(getDb(), mod.id, direction);
  revalidatePath(`/courses/${mod.course_id}`);
}

export async function reorderModulesAction(
  courseId: number,
  orderedIds: number[],
): Promise<void> {
  const parsedCourseId = courseIdSchema.safeParse(courseId);
  if (!parsedCourseId.success) {
    return;
  }

  const course = getCourseById(getDb(), parsedCourseId.data);
  if (!course) {
    return;
  }

  if (!isValidReorderIds(orderedIds)) {
    return;
  }

  const db = getDb();
  const moduleIds = new Set(
    listModulesByCourse(db, course.id).map((mod) => mod.id),
  );
  if (
    orderedIds.length !== moduleIds.size ||
    orderedIds.some((id) => !moduleIds.has(id))
  ) {
    return;
  }

  reorderModules(db, course.id, orderedIds);
  revalidatePath(`/courses/${course.id}`);
}

function isValidReorderIds(ids: number[]): boolean {
  if (!Array.isArray(ids) || ids.length === 0) {
    return false;
  }
  const seen = new Set<number>();
  for (const id of ids) {
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) {
      return false;
    }
    seen.add(id);
  }
  return true;
}
