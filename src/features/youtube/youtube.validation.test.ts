import { describe, expect, it } from "vitest";
import {
  youtubePageTokenSchema,
  youtubeSearchQuerySchema,
  youtubeThumbnailUrlSchema,
  youtubeVideoIdSchema,
} from "@/features/youtube/youtube.validation";

describe("youtubeSearchQuerySchema", () => {
  it("accepts a normal search term", () => {
    expect(youtubeSearchQuerySchema.parse("react hooks")).toBe("react hooks");
  });

  it("trims surrounding whitespace", () => {
    expect(youtubeSearchQuerySchema.parse("  sqlite  ")).toBe("sqlite");
  });

  it("rejects empty and whitespace-only queries", () => {
    expect(youtubeSearchQuerySchema.safeParse("").success).toBe(false);
    expect(youtubeSearchQuerySchema.safeParse("   ").success).toBe(false);
  });

  it("rejects overlong queries", () => {
    expect(
      youtubeSearchQuerySchema.safeParse("x".repeat(201)).success,
    ).toBe(false);
  });
});

describe("youtubeVideoIdSchema", () => {
  it("accepts an 11-character video id", () => {
    expect(youtubeVideoIdSchema.parse("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rejects ids of the wrong length", () => {
    expect(youtubeVideoIdSchema.safeParse("dQw4").success).toBe(false);
    expect(
      youtubeVideoIdSchema.safeParse("dQw4w9WgXcQdQw4").success,
    ).toBe(false);
  });

  it("rejects ids with invalid characters", () => {
    expect(youtubeVideoIdSchema.safeParse("dQw4w9WgXc!").success).toBe(false);
    expect(youtubeVideoIdSchema.safeParse("dQw4w9WgXc ").success).toBe(false);
  });
});

describe("youtubePageTokenSchema", () => {
  it("accepts a normal page token", () => {
    expect(youtubePageTokenSchema.parse("EiAKGAE")).toBe("EiAKGAE");
  });

  it("trims surrounding whitespace", () => {
    expect(youtubePageTokenSchema.parse("  EiAKGAE  ")).toBe("EiAKGAE");
  });

  it("rejects empty page tokens", () => {
    expect(youtubePageTokenSchema.safeParse("").success).toBe(false);
  });

  it("rejects overlong page tokens", () => {
    expect(
      youtubePageTokenSchema.safeParse("x".repeat(513)).success,
    ).toBe(false);
  });
});

describe("youtubeThumbnailUrlSchema", () => {
  it("accepts ytimg.com CDN URLs", () => {
    const url = "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg";
    expect(youtubeThumbnailUrlSchema.safeParse(url).success).toBe(true);
  });

  it("accepts bare ytimg.com host", () => {
    expect(
      youtubeThumbnailUrlSchema.safeParse("https://ytimg.com/vi/x/hq.jpg").success,
    ).toBe(true);
  });

  it("rejects non-ytimg hosts", () => {
    expect(
      youtubeThumbnailUrlSchema.safeParse(
        "https://evil.example.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      ).success,
    ).toBe(false);
    expect(
      youtubeThumbnailUrlSchema.safeParse(
        "https://youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      ).success,
    ).toBe(false);
  });

  it("rejects non-URLs", () => {
    expect(youtubeThumbnailUrlSchema.safeParse("not a url").success).toBe(false);
    expect(youtubeThumbnailUrlSchema.safeParse("").success).toBe(false);
  });
});