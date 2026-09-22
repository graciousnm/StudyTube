import { describe, expect, it } from "vitest";
import {
  courseOutlineSchema,
  generateOutlineInputSchema,
} from "./ai.validation";

describe("generateOutlineInputSchema", () => {
  it("accepts a valid input", () => {
    const result = generateOutlineInputSchema.safeParse({
      goal: "Learn worship piano",
      experience: "Beginner",
      detail: "standard",
    });
    expect(result.success).toBe(true);
  });

  it("accepts input without experience", () => {
    const result = generateOutlineInputSchema.safeParse({
      goal: "Learn worship piano",
      detail: "short",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing goal", () => {
    expect(
      generateOutlineInputSchema.safeParse({ detail: "standard" }).success,
    ).toBe(false);
  });

  it("rejects an empty goal", () => {
    expect(
      generateOutlineInputSchema.safeParse({ goal: "  ", detail: "standard" })
        .success,
    ).toBe(false);
  });

  it("rejects an invalid detail level", () => {
    expect(
      generateOutlineInputSchema.safeParse({
        goal: "Learn something",
        detail: "extra",
      }).success,
    ).toBe(false);
  });

  it("trims whitespace from goal", () => {
    const result = generateOutlineInputSchema.safeParse({
      goal: "  Learn worship piano  ",
      detail: "standard",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.goal).toBe("Learn worship piano");
    }
  });
});

describe("courseOutlineSchema", () => {
  const validOutline = {
    title: "Worship Piano",
    description: "Learn worship piano.",
    modules: [
      {
        title: "Basics",
        description: "Getting started.",
        topics: ["Posture", "Scales"],
      },
    ],
  };

  it("accepts a valid outline", () => {
    expect(courseOutlineSchema.safeParse(validOutline).success).toBe(true);
  });

  it("accepts an outline without description", () => {
    const { description: _description, ...rest } = validOutline;
    void _description;
    expect(courseOutlineSchema.safeParse(rest).success).toBe(true);
  });

  it("defaults description to empty string", () => {
    const { description: _description, ...rest } = validOutline;
    void _description;
    const result = courseOutlineSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });

  it("rejects a missing title", () => {
    const { title: _title, ...rest } = validOutline;
    void _title;
    expect(courseOutlineSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(
      courseOutlineSchema.safeParse({ ...validOutline, title: "  " }).success,
    ).toBe(false);
  });

  it("rejects no modules", () => {
    expect(
      courseOutlineSchema.safeParse({ ...validOutline, modules: [] }).success,
    ).toBe(false);
  });

  it("rejects a module with no title", () => {
    expect(
      courseOutlineSchema.safeParse({
        ...validOutline,
        modules: [{ title: "", description: "", topics: ["Topic"] }],
      }).success,
    ).toBe(false);
  });

  it("rejects a module with no topics", () => {
    expect(
      courseOutlineSchema.safeParse({
        ...validOutline,
        modules: [{ title: "Mod", description: "", topics: [] }],
      }).success,
    ).toBe(false);
  });

  it("rejects a module with an empty topic string", () => {
    expect(
      courseOutlineSchema.safeParse({
        ...validOutline,
        modules: [{ title: "Mod", description: "", topics: ["  "] }],
      }).success,
    ).toBe(false);
  });

  it("trims whitespace from fields", () => {
    const result = courseOutlineSchema.safeParse({
      title: "  Title  ",
      description: "  Desc  ",
      modules: [
        {
          title: "  Mod Title  ",
          description: "  Mod Desc  ",
          topics: ["  Topic 1  ", "  Topic 2  "],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Title");
      expect(result.data.description).toBe("Desc");
      expect(result.data.modules[0].title).toBe("Mod Title");
      expect(result.data.modules[0].description).toBe("Mod Desc");
      expect(result.data.modules[0].topics).toEqual(["Topic 1", "Topic 2"]);
    }
  });
});
