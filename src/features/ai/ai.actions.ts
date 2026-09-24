"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { createCourseWithModules } from "@/features/courses/course.mutations";
import { courseIdSchema } from "@/features/courses/course.validation";
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
  curateVideosInputSchema,
  curatedVideosSchema,
  generateOutlineInputSchema,
  searchQueriesSchema,
  topicsWithResultsSchema,
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
  const parsed = curateVideosInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid course data. Please try again." };
  }

  try {
    const queries = await generateSearchQueries(parsed.data, 45_000);
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
  const parsed = searchQueriesSchema.safeParse(queries);
  if (!parsed.success) {
    return { error: "Invalid search data. Please try again." };
  }

  try {
    const results = await Promise.all(
      parsed.data.map(async (q) => {
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
  const parsedInput = curateVideosInputSchema.safeParse(input);
  const parsedTopics = topicsWithResultsSchema.safeParse(topicsWithResults);
  if (!parsedInput.success || !parsedTopics.success) {
    return { error: "Invalid course data. Please try again." };
  }

  try {
    const selections = await selectBestVideos(
      parsedInput.data,
      parsedTopics.data,
      60_000,
    );
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
  const parsedVideos = curatedVideosSchema.safeParse(videos);
  if (!parsedVideos.success) {
    return { added: 0, errors: ["The video data was invalid. Please try again."] };
  }

  const parsedCourseId = courseIdSchema.safeParse(courseId);
  if (!parsedCourseId.success) {
    return { added: 0, errors: [] };
  }

  const added: number[] = [];
  const errors: string[] = [];

  for (const v of parsedVideos.data) {
    const result = await addVideoToModuleAction(
      parsedCourseId.data,
      v.moduleId,
      v.videoId,
    );
    if (result.success) {
      added.push(v.moduleId);
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  revalidatePath(`/courses/${parsedCourseId.data}`);
  return { added: added.length, errors };
}
