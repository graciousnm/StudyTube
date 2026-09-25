import { describe, expect, it, vi } from "vitest";
import {
  generateSearchQueries,
  selectBestVideos,
  generateModuleOutline,
  suggestMissingModule,
} from "./ai.provider";
import { searchYouTube } from "@/features/youtube/youtube.search";
import { addVideoToModuleAction } from "@/features/lessons/lesson.actions";
import { listLessonsByModule } from "@/features/lessons/lesson.queries";
import { getCourseById } from "@/features/courses/course.queries";
import { createModule } from "@/features/modules/module.mutations";
import { listModulesByCourse } from "@/features/modules/module.queries";
import type { Course, Lesson, Module } from "@/db/schema";
import {
  addCuratedVideosAction,
  createModuleFromOutlineAction,
  generateModuleOutlineAction,
  generateSearchQueriesAction,
  searchYouTubeBatchAction,
  selectBestVideosAction,
  suggestMissingModuleAction,
} from "./ai.actions";

vi.mock("./ai.provider", () => ({
  generateSearchQueries: vi.fn(),
  selectBestVideos: vi.fn(),
  generateModuleOutline: vi.fn(),
  suggestMissingModule: vi.fn(),
  AiProviderError: class AiProviderError extends Error {},
}));

vi.mock("@/features/youtube/youtube.search", () => ({
  searchYouTube: vi.fn(),
}));

vi.mock("@/features/lessons/lesson.actions", () => ({
  addVideoToModuleAction: vi.fn(),
}));

vi.mock("@/db/client", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/features/courses/course.queries", () => ({
  getCourseById: vi.fn(),
}));

vi.mock("@/features/modules/module.mutations", () => ({
  createModule: vi.fn(),
}));

vi.mock("@/features/modules/module.queries", () => ({
  listModulesByCourse: vi.fn(),
}));

vi.mock("@/features/lessons/lesson.queries", () => ({
  listLessonsByModule: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const validInput = {
  courseTitle: "Worship Piano",
  courseDescription: "Learn worship piano.",
  modules: [
    {
      moduleId: 1,
      title: "Basics",
      topics: ["Posture", "Scales"],
    },
  ],
};

describe("generateSearchQueriesAction", () => {
  it("returns an error for malformed input without calling the provider", async () => {
    const result = await generateSearchQueriesAction({
      ...validInput,
      modules: [],
    });

    expect(result.error).toBeDefined();
    expect(generateSearchQueries).not.toHaveBeenCalled();
  });

  it("returns an error for an over-long course title", async () => {
    const result = await generateSearchQueriesAction({
      ...validInput,
      courseTitle: "x".repeat(201),
    });

    expect(result.error).toBeDefined();
    expect(generateSearchQueries).not.toHaveBeenCalled();
  });

  it("passes through provider results for valid input", async () => {
    vi.mocked(generateSearchQueries).mockResolvedValueOnce([
      { moduleIndex: 0, topicIndex: 0, query: "worship piano tutorial" },
    ]);

    const result = await generateSearchQueriesAction(validInput);

    expect(result.queries).toHaveLength(1);
  });
});

describe("searchYouTubeBatchAction", () => {
  it("returns an error for an empty query list without calling youtube", async () => {
    const result = await searchYouTubeBatchAction([]);

    expect(result.error).toBeDefined();
    expect(searchYouTube).not.toHaveBeenCalled();
  });

  it("returns an error for an over-long query", async () => {
    const result = await searchYouTubeBatchAction([
      { moduleIndex: 0, topicIndex: 0, query: "x".repeat(201) },
    ]);

    expect(result.error).toBeDefined();
    expect(searchYouTube).not.toHaveBeenCalled();
  });

  it("searches for valid queries", async () => {
    vi.mocked(searchYouTube).mockResolvedValueOnce({
      items: [],
      nextPageToken: null,
    });

    const result = await searchYouTubeBatchAction([
      { moduleIndex: 0, topicIndex: 0, query: "worship piano tutorial" },
    ]);

    expect(result.results).toHaveLength(1);
  });
});

describe("selectBestVideosAction", () => {
  it("returns an error for malformed input without calling the provider", async () => {
    const result = await selectBestVideosAction(
      { ...validInput, modules: [] },
      [],
    );

    expect(result.error).toBeDefined();
    expect(selectBestVideos).not.toHaveBeenCalled();
  });

  it("returns an error for results with an invalid video id", async () => {
    const result = await selectBestVideosAction(validInput, [
      {
        moduleIndex: 0,
        topicIndex: 0,
        query: "worship piano",
        results: [
          {
            youtubeVideoId: "js://not-youtube",
            title: "Bad",
            channelName: null,
            durationSeconds: null,
          },
        ],
      },
    ]);

    expect(result.error).toBeDefined();
    expect(selectBestVideos).not.toHaveBeenCalled();
  });

  it("passes through selections for valid input", async () => {
    vi.mocked(selectBestVideos).mockResolvedValueOnce([
      { moduleIndex: 0, topicIndex: 0, videoId: "AAAAAAAAAAA" },
    ]);

    const result = await selectBestVideosAction(validInput, [
      {
        moduleIndex: 0,
        topicIndex: 0,
        query: "worship piano",
        results: [],
      },
    ]);

    expect(result.selections).toHaveLength(1);
  });
});

describe("addCuratedVideosAction", () => {
  it("rejects an invalid video list without adding anything", async () => {
    const result = await addCuratedVideosAction(1, [
      { moduleId: 1, videoId: "not-a-video-id" },
    ]);

    expect(result.added).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(addVideoToModuleAction).not.toHaveBeenCalled();
  });

  it("rejects an unsafe course id", async () => {
    const result = await addCuratedVideosAction(Number.NaN, [
      { moduleId: 1, videoId: "AAAAAAAAAAA" },
    ]);

    expect(result.added).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(addVideoToModuleAction).not.toHaveBeenCalled();
  });

  it("adds valid videos through the lesson action", async () => {
    vi.mocked(addVideoToModuleAction).mockResolvedValueOnce({ success: true });

    const result = await addCuratedVideosAction(1, [
      { moduleId: 1, videoId: "AAAAAAAAAAA" },
    ]);

    expect(result.added).toBe(1);
  });
});

describe("generateModuleOutlineAction", () => {
  const validInput = {
    courseTitle: "Worship Piano",
    courseDescription: "Learn worship piano.",
    focus: "Dominant chords",
    detail: "standard" as const,
  };

  it("returns an error for a missing focus without calling the provider", async () => {
    const result = await generateModuleOutlineAction({
      ...validInput,
      focus: "",
    });

    expect(result.error).toBeDefined();
    expect(generateModuleOutline).not.toHaveBeenCalled();
  });

  it("returns an error for an over-long course title", async () => {
    const result = await generateModuleOutlineAction({
      ...validInput,
      courseTitle: "x".repeat(201),
    });

    expect(result.error).toBeDefined();
    expect(generateModuleOutline).not.toHaveBeenCalled();
  });

  it("passes through provider results for valid input", async () => {
    vi.mocked(generateModuleOutline).mockResolvedValueOnce({
      title: "Dominant Chords",
      description: "How to use dominant chords in worship.",
      topics: ["I-IV-V", "Cadences"],
    });

    const result = await generateModuleOutlineAction(validInput);

    expect(result.error).toBeUndefined();
    expect(result.outline?.title).toBe("Dominant Chords");
    expect(result.outline?.topics).toHaveLength(2);
  });

  it("surfaces a provider failure as an error", async () => {
    vi.mocked(generateModuleOutline).mockRejectedValueOnce(
      new Error("boom"),
    );

    const result = await generateModuleOutlineAction(validInput);

    expect(result.outline).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});

describe("suggestMissingModuleAction", () => {
  it("rejects an unsafe course id without calling the provider", async () => {
    const result = await suggestMissingModuleAction(Number.NaN);

    expect(result.error).toBeDefined();
    expect(suggestMissingModule).not.toHaveBeenCalled();
  });

  it("returns an error when the course does not exist", async () => {
    vi.mocked(getCourseById).mockReturnValueOnce(undefined);

    const result = await suggestMissingModuleAction(1);

    expect(result.error).toBe("This course no longer exists.");
    expect(suggestMissingModule).not.toHaveBeenCalled();
  });

  it("returns an error when the course has no modules", async () => {
    vi.mocked(getCourseById).mockReturnValueOnce({
      id: 1,
      title: "Worship Piano",
      description: "Learn worship piano.",
      goal: "Play for Sunday service",
    } as Course);
    vi.mocked(listModulesByCourse).mockReturnValueOnce([]);

    const result = await suggestMissingModuleAction(1);

    expect(result.error).toContain("Add at least one module");
    expect(suggestMissingModule).not.toHaveBeenCalled();
  });

  it("scans modules and lesson titles, skipping null titles, for valid input", async () => {
    vi.mocked(getCourseById).mockReturnValueOnce({
      id: 1,
      title: "Worship Piano",
      description: "Learn worship piano.",
      goal: "Play for Sunday service",
    } as Course);
    vi.mocked(listModulesByCourse).mockReturnValueOnce([
      {
        id: 4,
        title: "Basics",
        description: "Getting started.",
        course_id: 1,
        position: 1,
      },
    ] as Module[]);
    vi.mocked(listLessonsByModule).mockReturnValueOnce([
      { youtube_title: "Posture" },
      { youtube_title: null },
      { youtube_title: "Scales" },
    ] as Lesson[]);
    vi.mocked(suggestMissingModule).mockResolvedValueOnce({
      title: "Music Theory",
      description: "The course never covers theory, which ties it together.",
      topics: ["Note names", "Intervals", "Chords"],
    });

    const result = await suggestMissingModuleAction(1);

    expect(result.error).toBeUndefined();
    expect(result.outline?.title).toBe("Music Theory");
    expect(suggestMissingModule).toHaveBeenCalledTimes(1);
    const input = vi.mocked(suggestMissingModule).mock.calls[0][0];
    expect(input.existingModules[0].lessonTitles).toEqual(["Posture", "Scales"]);
  });
});

describe("createModuleFromOutlineAction", () => {
  const validOutline = {
    title: "Dominant Chords",
    description: "How to use dominant chords in worship.",
    topics: ["I-IV-V", "Cadences"],
  };

  it("rejects an unsafe course id without creating a module", async () => {
    const result = await createModuleFromOutlineAction(Number.NaN, validOutline);

    expect(result.error).toBeDefined();
    expect(createModule).not.toHaveBeenCalled();
  });

  it("rejects an invalid outline without creating a module", async () => {
    const result = await createModuleFromOutlineAction(1, {
      ...validOutline,
      topics: [],
    });

    expect(result.error).toBe("Invalid module outline. Please try again.");
    expect(createModule).not.toHaveBeenCalled();
  });

  it("creates a module and returns its id and topics", async () => {
    vi.mocked(createModule).mockReturnValueOnce({
      id: 9,
      course_id: 1,
      title: "Dominant Chords",
      description: "How to use dominant chords in worship.",
      position: 2,
    } as Module);

    const result = await createModuleFromOutlineAction(1, validOutline);

    expect(result.error).toBeUndefined();
    expect(result.moduleId).toBe(9);
    expect(result.title).toBe("Dominant Chords");
    expect(result.topics).toEqual(validOutline.topics);
  });
});