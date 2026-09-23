import { describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const searchYouTubeMock = vi.fn();

vi.mock("@/features/youtube/youtube.search", () => ({
  searchYouTube: searchYouTubeMock,
}));

const GET = (await import("./route")).GET;

function request(query: string): Request {
  return new Request(`http://localhost/api/youtube/search?q=${encodeURIComponent(query)}`);
}

describe("GET /api/youtube/search", () => {
  it("returns normalized search results", async () => {
    searchYouTubeMock.mockResolvedValue({
      items: [
        {
          youtubeVideoId: "aaaaaaaaaaa",
          title: "Alpha",
          channelId: null,
          channelName: "Channel",
          thumbnailUrl: null,
          durationSeconds: 60,
          description: null,
          publishedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      ],
      nextPageToken: null,
    });

    const nextResponse = await GET(request("alpha"));
    expect(nextResponse.status).toBe(200);
    const body = await nextResponse.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].youtubeVideoId).toBe("aaaaaaaaaaa");
  });

  it("rejects an empty query", async () => {
    const nextResponse = await GET(request(""));
    expect(nextResponse.status).toBe(400);
    const body = await nextResponse.json();
    expect(body.error).toBeDefined();
    expect(searchYouTubeMock).not.toHaveBeenCalled();
  });

  it("returns 502 for a temporary YouTube failure", async () => {
    searchYouTubeMock.mockRejectedValue(new Error("down"));

    const nextResponse = await GET(request("alpha"));
    expect(nextResponse.status).toBe(502);
    const body = await nextResponse.json();
    expect(body.error).toBeDefined();
  });

  it("sets no-store caching", async () => {
    searchYouTubeMock.mockResolvedValue({ items: [], nextPageToken: null });
    const nextResponse = await GET(request("alpha"));
    expect(nextResponse.headers.get("cache-control")).toBe("no-store");
  });

  it("returns NextResponse instances", async () => {
    searchYouTubeMock.mockResolvedValue({ items: [], nextPageToken: null });
    const nextResponse = await GET(request("alpha"));
    expect(nextResponse).toBeInstanceOf(NextResponse);
  });
});