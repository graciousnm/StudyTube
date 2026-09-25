"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { createCourseWithModules } from "@/features/courses/course.mutations";
import { getCourseById } from "@/features/courses/course.queries";
import { courseIdSchema } from "@/features/courses/course.validation";
import { addVideoToModuleAction } from "@/features/lessons/lesson.actions";
import { listLessonsByModule } from "@/features/lessons/lesson.queries";
import { createModule } from "@/features/modules/module.mutations";
import { listModulesByCourse } from "@/features/modules/module.queries";
import { searchYouTube } from "@/features/youtube/youtube.search";
import {
  generateModuleOutline,
  generateOutline,
  generateSearchQueries,
  selectBestVideos,
  suggestMissingModule,
  AiProviderError,
} from "./ai.provider";
import type {
  CourseOutline,
  CurateVideosInput,
  GenerateModuleInput,
  GenerateOutlineInput,
  ModuleOutline,
  SearchQuery,
  SuggestMissingModuleInput,
  TopicSearchResults,
  VideoSelection,
} from "./ai.types";
import {
  courseOutlineSchema,
  curateVideosInputSchema,
  curatedVideosSchema,
  generateModuleInputSchema,
  generateOutlineInputSchema,
  moduleOutlineSchema,
  searchQueriesSchema,
  suggestMissingModuleInputSchema,
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

export async function generateModuleOutlineAction(
  input: GenerateModuleInput,
): Promise<{ outline?: ModuleOutline; error?: string }> {
  const parsed = generateModuleInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please fill in the required fields." };
  }

  try {
    const outline = await generateModuleOutline(parsed.data);
    return { outline };
  } catch (error) {
    if (error instanceof AiProviderError) {
      return { error: error.message };
    }
    return {
      error:
        "We couldn't generate a module right now. Please try again.",
    };
  }
}

export async function suggestMissingModuleAction(
  courseId: number,
): Promise<{ outline?: ModuleOutline; error?: string }> {
  const parsedId = courseIdSchema.safeParse(courseId);
  if (!parsedId.success) {
    return { error: "This course no longer exists." };
  }

  const course = getCourseById(getDb(), parsedId.data);
  if (!course) {
    return { error: "This course no longer exists." };
  }

  const db = getDb();
  const existingModules = listModulesByCourse(db, course.id);
  if (existingModules.length === 0) {
    return { error: "Add at least one module before asking for a suggestion." };
  }

  const input: SuggestMissingModuleInput = {
    courseTitle: course.title,
    courseDescription: course.description ?? "",
    courseGoal: course.goal ?? undefined,
    existingModules: existingModules.slice(0, 24).map((mod) => ({
      title: mod.title,
      description: mod.description ?? "",
      lessonTitles: listLessonsByModule(db, mod.id)
        .slice(0, 8)
        .flatMap((lesson) => (lesson.youtube_title ? [lesson.youtube_title] : [])),
    })),
  };

  const parsed = suggestMissingModuleInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "We couldn't scan this course right now. Please try again.",
    };
  }

  try {
    const outline = await suggestMissingModule(parsed.data);
    return { outline };
  } catch (error) {
    if (error instanceof AiProviderError) {
      return { error: error.message };
    }
    return {
      error:
        "We couldn't scan this course right now. Please try again.",
    };
  }
}

export async function createModuleFromOutlineAction(
  courseId: number,
  outline: ModuleOutline,
): Promise<{ moduleId?: number; title?: string; topics?: string[]; error?: string }> {
  const parsedId = courseIdSchema.safeParse(courseId);
  const parsedOutline = moduleOutlineSchema.safeParse(outline);
  if (!parsedId.success) {
    return { error: "This course no longer exists." };
  }
  if (!parsedOutline.success) {
    return { error: "Invalid module outline. Please try again." };
  }

  try {
    const created = createModule(getDb(), parsedId.data, {
      title: parsedOutline.data.title,
      description: parsedOutline.data.description,
    });
    revalidatePath(`/courses/${parsedId.data}`);
    return {
      moduleId: created.id,
      title: created.title,
      topics: parsedOutline.data.topics,
    };
  } catch {
    return {
      error: "Failed to create the module. Please try again.",
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
