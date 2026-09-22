"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { getCourseById } from "@/features/courses/course.queries";
import { courseIdSchema } from "@/features/courses/course.validation";
import {
  createLesson,
  deleteLesson,
  moveLesson,
  reorderLessons,
} from "@/features/lessons/lesson.mutations";
import {
  findLessonByVideoId,
  getLessonInModule,
} from "@/features/lessons/lesson.queries";
import type { LessonActionState, MoveDirection } from "@/features/lessons/lesson.types";
import { lessonIdSchema } from "@/features/lessons/lesson.validation";
import { getModuleInCourse } from "@/features/modules/module.queries";
import { moduleIdSchema } from "@/features/modules/module.validation";
import { youTubeErrorMessage } from "@/features/youtube/youtube.errors";
import { getVideoMetadata } from "@/features/youtube/youtube.search";
import { extractVideoId } from "@/features/youtube/youtube.url";
import { youtubeVideoIdSchema } from "@/features/youtube/youtube.validation";

function resolveLesson(
  courseIdRaw: number,
  moduleIdRaw: number,
  lessonIdRaw: number,
) {
  const courseId = courseIdSchema.safeParse(courseIdRaw);
  const moduleId = moduleIdSchema.safeParse(moduleIdRaw);
  const lessonId = lessonIdSchema.safeParse(lessonIdRaw);
  if (!courseId.success || !moduleId.success || !lessonId.success) {
    return undefined;
  }

  const db = getDb();
  const course = getCourseById(db, courseId.data);
  if (!course) {
    return undefined;
  }

  const mod = getModuleInCourse(db, course.id, moduleId.data);
  if (!mod) {
    return undefined;
  }

  const lesson = getLessonInModule(db, mod.id, lessonId.data);
  if (!lesson) {
    return undefined;
  }

  return { course, mod, lesson };
}

export async function deleteLessonAction(
  courseId: number,
  moduleId: number,
  lessonId: number,
): Promise<LessonActionState> {
  const resolved = resolveLesson(courseId, moduleId, lessonId);
  if (!resolved) {
    return { error: "This lesson no longer exists." };
  }

  const { mod, lesson } = resolved;
  deleteLesson(getDb(), lesson.id);
  revalidatePath(`/courses/${mod.course_id}/modules/${mod.id}`);
  redirect(`/courses/${mod.course_id}/modules/${mod.id}`);
}

export async function moveLessonAction(
  courseId: number,
  moduleId: number,
  lessonId: number,
  direction: MoveDirection,
): Promise<void> {
  if (direction !== "up" && direction !== "down") {
    return;
  }

  const resolved = resolveLesson(courseId, moduleId, lessonId);
  if (!resolved) {
    return;
  }

  const { mod, lesson } = resolved;
  moveLesson(getDb(), lesson.id, direction);
  revalidatePath(`/courses/${mod.course_id}/modules/${mod.id}`);
}

function resolveModule(courseId: number, moduleId: number) {
  const parsedCourseId = courseIdSchema.safeParse(courseId);
  const parsedModuleId = moduleIdSchema.safeParse(moduleId);
  if (!parsedCourseId.success || !parsedModuleId.success) {
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

  return { course, mod };
}

export async function addVideoToModuleAction(
  courseId: number,
  moduleId: number,
  youtubeVideoId: string,
): Promise<LessonActionState> {
  const parsedVideoId = youtubeVideoIdSchema.safeParse(youtubeVideoId);
  if (!parsedVideoId.success) {
    return { error: "Invalid YouTube video ID." };
  }

  const resolved = resolveModule(courseId, moduleId);
  if (!resolved) {
    return { error: "This module no longer exists." };
  }

  const { course, mod } = resolved;
  if (findLessonByVideoId(getDb(), mod.id, parsedVideoId.data)) {
    return { error: "This video is already in this module." };
  }

  let metadata;
  try {
    metadata = await getVideoMetadata(parsedVideoId.data);
  } catch (error) {
    return { error: youTubeErrorMessage(error) };
  }

  try {
    createLesson(getDb(), mod.id, {
      youtube_video_id: metadata.youtubeVideoId,
      youtube_title: metadata.title,
      youtube_channel_id: metadata.channelId,
      youtube_channel_name: metadata.channelName,
      youtube_thumbnail_url: metadata.thumbnailUrl,
      youtube_duration: metadata.durationSeconds,
      youtube_description: metadata.description,
      youtube_published_at: metadata.publishedAt,
    });
  } catch {
    return { error: "This video is already in this module." };
  }

  revalidatePath(`/courses/${mod.course_id}/modules/${mod.id}`);
  revalidatePath(`/courses/${course.id}/modules/${mod.id}/add`);
  return { success: true };
}

export async function reorderLessonsAction(
  courseId: number,
  moduleId: number,
  orderedIds: number[],
): Promise<void> {
  const resolved = resolveModule(courseId, moduleId);
  if (!resolved) {
    return;
  }

  const { mod } = resolved;

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return;
  }

  reorderLessons(getDb(), mod.id, orderedIds);
  revalidatePath(`/courses/${mod.course_id}/modules/${mod.id}`);
}

export async function addVideoByUrlAction(
  courseId: number,
  moduleId: number,
  url: string,
): Promise<LessonActionState> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return { error: "Invalid YouTube URL." };
  }
  return addVideoToModuleAction(courseId, moduleId, videoId);
}

export async function addVideosToModuleAction(
  courseId: number,
  moduleId: number,
  videoIds: string[],
): Promise<{ added: number; duplicates: number; errors: number }> {
  const resolved = resolveModule(courseId, moduleId);
  if (!resolved) {
    return { added: 0, duplicates: 0, errors: videoIds.length };
  }

  const { course, mod } = resolved;
  let added = 0;
  let duplicates = 0;
  let errors = 0;

  for (const rawId of videoIds) {
    const parsed = youtubeVideoIdSchema.safeParse(rawId);
    if (!parsed.success) {
      errors++;
      continue;
    }

    if (findLessonByVideoId(getDb(), mod.id, parsed.data)) {
      duplicates++;
      continue;
    }

    let metadata;
    try {
      metadata = await getVideoMetadata(parsed.data);
    } catch {
      errors++;
      continue;
    }

    try {
      createLesson(getDb(), mod.id, {
        youtube_video_id: metadata.youtubeVideoId,
        youtube_title: metadata.title,
        youtube_channel_id: metadata.channelId,
        youtube_channel_name: metadata.channelName,
        youtube_thumbnail_url: metadata.thumbnailUrl,
        youtube_duration: metadata.durationSeconds,
        youtube_description: metadata.description,
        youtube_published_at: metadata.publishedAt,
      });
      added++;
    } catch {
      duplicates++;
    }
  }

  if (added > 0) {
    revalidatePath(`/courses/${mod.course_id}/modules/${mod.id}`);
    revalidatePath(`/courses/${course.id}/modules/${mod.id}/add`);
  }

  return { added, duplicates, errors };
}
