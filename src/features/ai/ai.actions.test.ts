import { describe, expect, it, vi } from "vitest";
import {
  generateSearchQueries,
  selectBestVideos,
} from "./ai.provider";
import { searchYouTube } from "@/features/youtube/youtube.search";
import { addVideoToModuleAction } from "@/features/lessons/lesson.actions";
import {
  addCuratedVideosAction,
  generateSearchQueriesAction,
  searchYouTubeBatchAction,
  selectBestVideosAction,
} from "./ai.actions";

vi.mock("./ai.provider", () => ({
  generateSearchQueries: vi.fn(),
  selectBestVideos: vi.fn(),
  AiProviderError: class AiProviderError extends Error {},
}));

vi.mock("@/features/youtube/youtube.search", () => ({
  searchYouTube: vi.fn(),
}));

vi.mock("@/features/lessons/lesson.actions", () => ({
  addVideoToModuleAction: vi.fn(),
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