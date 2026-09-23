"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { createCourseWithModules } from "@/features/courses/course.mutations";
import { addVideoToModuleAction } from "@/features/lessons/lesson.actions";
import { searchYouTube } from "@/features/youtube/youtube.search";
import {
  generateOutline,
  generateSearchQueries,
  selectBestVideos,
  AiProviderError,
} from "./ai.provider";
import type {
  CourseOutline,
  CurateVideosInput,
  GenerateOutlineInput,
  SearchQuery,
  TopicSearchResults,
  VideoSelection,
} from "./ai.types";
import {
  courseOutlineSchema,
  generateOutlineInputSchema,
} from "./ai.validation";

export async function generateOutlineAction(
  input: GenerateOutlineInput,
): Promise<{ outline?: CourseOutline; error?: string }> {
  const parsed = generateOutlineInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please fill in the required fields." };
  }

  try {
    const outline = await generateOutline(parsed.data);
    return { outline };
  } catch (error) {
    if (error instanceof AiProviderError) {
      return { error: error.message };
    }
    return {
      error:
        "We couldn't generate your learning path right now. Please try again.",
    };
  }
}

export async function createCourseFromOutlineAction(
  outline: CourseOutline,
): Promise<{ courseId?: number; modules?: { moduleId: number; title: string }[]; error?: string }> {
  const parsed = courseOutlineSchema.safeParse(outline);
  if (!parsed.success) {
    return { error: "Invalid course outline. Please try again." };
  }

  try {
    const result = createCourseWithModules(getDb(), {
      title: parsed.data.title,
      description: parsed.data.description,
      modules: parsed.data.modules.map((m) => ({
        title: m.title,
        description: m.description,
      })),
    });
    revalidatePath("/");
    return {
      courseId: result.course.id,
      modules: result.modules.map((m) => ({ moduleId: m.id, title: m.title })),
    };
  } catch {
    return {
      error: "Failed to create the course. Please try again.",
    };
  }
}

export async function generateSearchQueriesAction(
  input: CurateVideosInput,
): Promise<{ queries?: SearchQuery[]; error?: string }> {
  if (
    !input.courseTitle ||
    input.modules.length === 0 ||
    input.modules.some((m) => m.topics.length === 0)
  ) {
    return { error: "Invalid course data. Please try again." };
  }

  try {
    const queries = await generateSearchQueries(input, 45_000);
    return { queries };
  } catch (error) {
    if (error instanceof AiProviderError) {
      return { error: error.message };
    }
    return {
      error:
        "We couldn't generate search queries right now. Please try again.",
    };
  }
}

export async function searchYouTubeBatchAction(
  queries: SearchQuery[],
): Promise<{ results?: TopicSearchResults[]; error?: string }> {
  try {
    const results = await Promise.all(
      queries.map(async (q) => {
        try {
          const { items: videos } = await searchYouTube(q.query);
          return {
            moduleIndex: q.moduleIndex,
            topicIndex: q.topicIndex,
            query: q.query,
            results: videos.slice(0, 5).map((v) => ({
              youtubeVideoId: v.youtubeVideoId,
              title: v.title,
              channelName: v.channelName,
              durationSeconds: v.durationSeconds,
            })),
          };
        } catch {
          return {
            moduleIndex: q.moduleIndex,
            topicIndex: q.topicIndex,
            query: q.query,
            results: [],
          };
        }
      }),
    );
    return { results };
  } catch {
    return {
      error: "YouTube search failed. Please try again.",
    };
  }
}

export async function selectBestVideosAction(
  input: CurateVideosInput,
  topicsWithResults: TopicSearchResults[],
): Promise<{ selections?: VideoSelection[]; error?: string }> {
  try {
    const selections = await selectBestVideos(input, topicsWithResults, 60_000);
    return { selections };
  } catch (error) {
    if (error instanceof AiProviderError) {
      return { error: error.message };
    }
    return {
      error:
        "We couldn't select videos right now. Please try again.",
    };
  }
}

export async function addCuratedVideosAction(
  courseId: number,
  videos: { moduleId: number; videoId: string }[],
): Promise<{ added: number; errors: string[] }> {
  const added: number[] = [];
  const errors: string[] = [];

  for (const v of videos) {
    const result = await addVideoToModuleAction(
      courseId,
      v.moduleId,
      v.videoId,
    );
    if (result.success) {
      added.push(v.moduleId);
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  revalidatePath(`/courses/${courseId}`);
  return { added: added.length, errors };
}
