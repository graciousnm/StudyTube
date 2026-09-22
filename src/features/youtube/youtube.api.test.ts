import { afterEach, describe, expect, it, vi } from "vitest";
import { parseIsoDuration, youtubeGet } from "@/features/youtube/youtube.api";
import { YouTubeError } from "@/features/youtube/youtube.errors";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.YOUTUBE_API_KEY;
});

describe("parseIsoDuration", () => {
  it("parses combined durations", () => {
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("PT1M2S")).toBe(62);
    expect(parseIsoDuration("PT5M")).toBe(300);
    expect(parseIsoDuration("P1DT2H")).toBe(93600);
    expect(parseIsoDuration("PT3H")).toBe(10800);
  });

  it("returns null for empty and invalid values", () => {
    expect(parseIsoDuration(null)).toBeNull();
    expect(parseIsoDuration(undefined)).toBeNull();
    expect(parseIsoDuration("")).toBeNull();
    expect(parseIsoDuration("P")).toBeNull();
    expect(parseIsoDuration("garbage")).toBeNull();
    expect(parseIsoDuration("PT3M5G")).toBeNull();
  });
});

describe("youtubeGet", () => {
  it("throws a configured error when the API key is missing", async () => {
    const error = await youtubeGet("search", { q: "test" }).catch(
      (caught) => caught,
    );
    expect(error).toBeInstanceOf(YouTubeError);
    expect((error as YouTubeError).code).toBe("not_configured");
  });

  it("maps an invalid key response", async () => {
    process.env.YOUTUBE_API_KEY = "BROKENKEY";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            error: { errors: [{ reason: "keyInvalid" }] },
          }),
          { status: 400 },
        );
      }),
    );

    const error = await youtubeGet("videos", { id: "aaaaaaaaaaa" }).catch(
      (caught) => caught,
    );
    expect(error).toBeInstanceOf(YouTubeError);
    expect((error as YouTubeError).code).toBe("invalid_key");
  });

  it("maps a quota exceeded response", async () => {
    process.env.YOUTUBE_API_KEY = "TESTKEY";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            error: { errors: [{ reason: "quotaExceeded" }] },
          }),
          { status: 403 },
        );
      }),
    );

    const error = await youtubeGet("search", { q: "test" }).catch(
      (caught) => caught,
    );
    expect(error).toBeInstanceOf(YouTubeError);
    expect((error as YouTubeError).code).toBe("quota_exceeded");
  });

  it("maps a raw network failure to temporarily unavailable", async () => {
    process.env.YOUTUBE_API_KEY = "TESTKEY";
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("down"))));

    const error = await youtubeGet("search", { q: "test" }).catch(
      (caught) => caught,
    );
    expect(error).toBeInstanceOf(YouTubeError);
    expect((error as YouTubeError).code).toBe("temporarily_unavailable");
  });

  it("passes the API key as a query parameter but never returns it", async () => {
    process.env.YOUTUBE_API_KEY = "SUPERSECRETKEY";
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain("key=SUPERSECRETKEY");
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const body = await youtubeGet("search", { q: "test" });
    expect(JSON.stringify(body)).not.toContain("SUPERSECRETKEY");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});