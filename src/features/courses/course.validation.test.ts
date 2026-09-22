import { describe, expect, it } from "vitest";
import { courseIdSchema, courseInputSchema } from "./course.validation";

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