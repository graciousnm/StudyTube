import { describe, expect, it } from "vitest";
import {
  youtubeSearchQuerySchema,
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