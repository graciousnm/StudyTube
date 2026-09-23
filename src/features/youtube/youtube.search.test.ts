import { afterEach, describe, expect, it, vi } from "vitest";
import { YouTubeError } from "@/features/youtube/youtube.errors";
import {
  getVideoMetadata,
  searchYouTube,
} from "@/features/youtube/youtube.search";

const SEARCH_RESPONSE = {
  items: [
    {
      id: { videoId: "aaaaaaaaaaa" },
      snippet: {
        title: "Alpha Lesson",
        channelId: "channel-alpha",
        channelTitle: "Alpha Channel",
        description: "First lesson",
        publishedAt: "2024-01-01T00:00:00.000Z",
        thumbnails: {
          medium: { url: "https://i.ytimg.com/vi/aaaaaaaaaaa/mqdefault.jpg" },
          high: { url: "https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg" },
        },
      },
    },
    {
      id: { videoId: "bbbbbbbbbbb" },
      snippet: {
        title: "Beta Lesson",
        channelTitle: "Beta Channel",
        thumbnails: {
          high: { url: "https://i.ytimg.com/vi/bbbbbbbbbbb/hqdefault.jpg" },
        },
      },
    },
  ],
};

const VIDEOS_RESPONSE = {
  items: [
    {
      id: "aaaaaaaaaaa",
      contentDetails: { duration: "PT12M34S" },
    },
    {
      id: "bbbbbbbbbbb",
      contentDetails: { duration: "PT1H2M5S" },
    },
  ],
};

function mockSuccess() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/videos")) {
        const ids = (url.searchParams.get("id") ?? "").split(",");
        const items = SEARCH_RESPONSE.items
          .filter((item) => ids.includes(item.id.videoId))
          .map((item) => {
            const video = VIDEOS_RESPONSE.items.find(
              (candidate) => candidate.id === item.id.videoId,
            );
            return {
              id: item.id.videoId,
              snippet: item.snippet,
              contentDetails: video?.contentDetails,
            };
          });
        return new Response(JSON.stringify({ items }), { status: 200 });
      }
      return new Response(JSON.stringify(SEARCH_RESPONSE), { status: 200 });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.YOUTUBE_API_KEY;
});

describe("searchYouTube", () => {
  it("normalizes search results with durations", async () => {
    process.env.YOUTUBE_API_KEY = "TESTKEY";
    mockSuccess();

    const { items: results } = await searchYouTube("learning");

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      youtubeVideoId: "aaaaaaaaaaa",
      title: "Alpha Lesson",
      channelId: "channel-alpha",
      channelName: "Alpha Channel",
      thumbnailUrl: "https://i.ytimg.com/vi/aaaaaaaaaaa/mqdefault.jpg",
      durationSeconds: 754,
      description: "First lesson",
      publishedAt: expect.any(Date),
    });
    expect(results[1].channelId).toBeNull();
    expect(results[1].durationSeconds).toBe(3725);
  });

  it("returns an empty list when YouTube reports no videos", async () => {
    process.env.YOUTUBE_API_KEY = "TESTKEY";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ items: [] }), { status: 200 }),
      ),
    );

    await expect(searchYouTube("nothing")).resolves.toEqual({ items: [], nextPageToken: null });
  });

  it("reports when the API key is not configured", async () => {
    const error = await searchYouTube("test").catch((caught) => caught);
    expect(error).toBeInstanceOf(YouTubeError);
    expect((error as YouTubeError).code).toBe("not_configured");
  });

  it("surfaces a malformed response as temporarily unavailable", async () => {
    process.env.YOUTUBE_API_KEY = "TESTKEY";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ items: "nope" }), { status: 200 }),
      ),
    );

    const error = await searchYouTube("test").catch((caught) => caught);
    expect(error).toBeInstanceOf(YouTubeError);
    expect((error as YouTubeError).code).toBe("temporarily_unavailable");
  });

  it("maps an unavailable network as temporarily unavailable", async () => {
    process.env.YOUTUBE_API_KEY = "TESTKEY";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("offline"))),
    );

    const error = await searchYouTube("test").catch((caught) => caught);
    expect(error).toBeInstanceOf(YouTubeError);
    expect((error as YouTubeError).code).toBe("temporarily_unavailable");
  });

  it("surfaces quota errors", async () => {
    process.env.YOUTUBE_API_KEY = "TESTKEY";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            error: { errors: [{ reason: "quotaExceeded" }] },
          }),
          { status: 403 },
        ),
      ),
    );

    const error = await searchYouTube("test").catch((caught) => caught);
    expect(error).toBeInstanceOf(YouTubeError);
    expect((error as YouTubeError).code).toBe("quota_exceeded");
  });

  it("never leaks the API key into search results", async () => {
    process.env.YOUTUBE_API_KEY = "SUPERSECRETKEY";
    mockSuccess();

    const { items: results } = await searchYouTube("learning");
    expect(JSON.stringify(results)).not.toContain("SUPERSECRETKEY");
  });
});

describe("getVideoMetadata", () => {
  it("returns metadata for an existing video", async () => {
    process.env.YOUTUBE_API_KEY = "TESTKEY";
    mockSuccess();

    const metadata = await getVideoMetadata("aaaaaaaaaaa");
    expect(metadata.youtubeVideoId).toBe("aaaaaaaaaaa");
    expect(metadata.title).toBe("Alpha Lesson");
    expect(metadata.durationSeconds).toBe(754);
  });

  it("reports a video that is unavailable on YouTube", async () => {
    process.env.YOUTUBE_API_KEY = "TESTKEY";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ items: [] }), {
        status: 200,
      })),
    );

    const error = await getVideoMetadata("zzzzzzzzzzz").catch(
      (caught) => caught,
    );
    expect(error).toBeInstanceOf(YouTubeError);
    expect((error as YouTubeError).code).toBe("video_unavailable");
    expect((error as YouTubeError).message).toContain("unavailable");
  });
});