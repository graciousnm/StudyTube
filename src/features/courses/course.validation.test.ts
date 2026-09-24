import { describe, expect, it } from "vitest";
import {
  courseIdSchema,
  courseImportSchema,
  courseInputSchema,
} from "./course.validation";

describe("courseInputSchema", () => {
  it("accepts a valid course", () => {
    const result = courseInputSchema.safeParse({
      title: "Real Estate",
      description: "Learn the fundamentals of real estate investing.",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        title: "Real Estate",
        description: "Learn the fundamentals of real estate investing.",
      });
    }
  });

  it("trims surrounding whitespace", () => {
    const result = courseInputSchema.safeParse({
      title: "  Worship Piano  ",
      description: "  Chords and progressions.  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        title: "Worship Piano",
        description: "Chords and progressions.",
      });
    }
  });

  it("defaults a missing description to an empty string", () => {
    const result = courseInputSchema.safeParse({ title: "Biblical Greek" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });

  it("rejects a missing title", () => {
    expect(courseInputSchema.safeParse({ description: "No title" }).success).toBe(
      false,
    );
  });

  it("rejects an empty or whitespace-only title", () => {
    expect(courseInputSchema.safeParse({ title: "" }).success).toBe(false);
    expect(courseInputSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("rejects a non-string title", () => {
    expect(courseInputSchema.safeParse({ title: 123 }).success).toBe(false);
    expect(courseInputSchema.safeParse({ title: null }).success).toBe(false);
  });

  it("rejects a title longer than 200 characters", () => {
    const result = courseInputSchema.safeParse({ title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("accepts a title of exactly 200 characters", () => {
    const result = courseInputSchema.safeParse({ title: "a".repeat(200) });
    expect(result.success).toBe(true);
  });

  it("rejects a description longer than 5,000 characters", () => {
    const result = courseInputSchema.safeParse({
      title: "Course",
      description: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts an optional learning goal", () => {
    const result = courseInputSchema.safeParse({
      title: "Worship Piano",
      goal: "Learn to play worship piano confidently",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.goal).toBe(
        "Learn to play worship piano confidently",
      );
    }
  });

  it("treats a whitespace-only goal as absent", () => {
    const result = courseInputSchema.safeParse({
      title: "Worship Piano",
      goal: "   ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.goal).toBeUndefined();
    }
  });

  it("rejects a goal longer than 500 characters", () => {
    const result = courseInputSchema.safeParse({
      title: "Course",
      goal: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("courseIdSchema", () => {
  it("accepts positive integer strings", () => {
    const result = courseIdSchema.safeParse("42");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(42);
    }
  });

  it("rejects non-numeric ids", () => {
    expect(courseIdSchema.safeParse("abc").success).toBe(false);
    expect(courseIdSchema.safeParse("").success).toBe(false);
  });

  it("rejects zero, negative, and fractional ids", () => {
    expect(courseIdSchema.safeParse("0").success).toBe(false);
    expect(courseIdSchema.safeParse("-3").success).toBe(false);
    expect(courseIdSchema.safeParse("1.5").success).toBe(false);
  });
});

describe("courseImportSchema", () => {
  it("accepts a valid course export with modules and lessons", () => {
    const result = courseImportSchema.safeParse({
      format: "studyforge-course",
      version: 1,
      course: {
        title: "Real Estate",
        description: "Fundamentals",
        goal: "Invest confidently",
        modules: [
          {
            title: "Basics",
            description: "Getting started",
            lessons: [
              {
                youtubeVideoId: "aaaaaaaaaaa",
                title: "Intro",
                channelName: "Some Channel",
                durationSeconds: 600,
                thumbnailUrl:
                  "https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg",
              },
            ],
          },
        ],
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects a wrong format marker", () => {
    const data = {
      format: "not-studyforge",
      version: 1,
      course: { title: "X", modules: [] },
    };
    expect(courseImportSchema.safeParse(data).success).toBe(false);
  });

  it("rejects an invalid youtube video id", () => {
    const data = {
      format: "studyforge-course",
      version: 1,
      course: {
        title: "X",
        modules: [{ title: "M", lessons: [{ youtubeVideoId: "nope" }] }],
      },
    };
    expect(courseImportSchema.safeParse(data).success).toBe(false);
  });

  it("rejects a non-ytimg thumbnail url", () => {
    const data = {
      format: "studyforge-course",
      version: 1,
      course: {
        title: "X",
        modules: [
          {
            title: "M",
            lessons: [
              {
                youtubeVideoId: "aaaaaaaaaaa",
                thumbnailUrl: "https://evil.example.com/x.jpg",
              },
            ],
          },
        ],
      },
    };
    expect(courseImportSchema.safeParse(data).success).toBe(false);
  });

  it("rejects export with more than 50 modules", () => {
    const data = {
      format: "studyforge-course",
      version: 1,
      course: {
        title: "X",
        modules: Array.from({ length: 51 }, (_, i) => ({
          title: `M${i}`,
          lessons: [],
        })),
      },
    };
    expect(courseImportSchema.safeParse(data).success).toBe(false);
  });

  it("rejects a module with more than 200 lessons", () => {
    const data = {
      format: "studyforge-course",
      version: 1,
      course: {
        title: "X",
        modules: [
          {
            title: "M",
            lessons: Array.from({ length: 201 }, (_, i) => ({
              youtubeVideoId: `aaaaaaaaaa${i % 10}${i % 11}`.slice(0, 11),
            })),
          },
        ],
      },
    };
    expect(courseImportSchema.safeParse(data).success).toBe(false);
  });

  it("defaults a missing module description to empty", () => {
    const result = courseImportSchema.safeParse({
      format: "studyforge-course",
      version: 1,
      course: {
        title: "X",
        modules: [{ title: "M", lessons: [] }],
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.course.modules[0].description).toBe("");
    }
  });
});