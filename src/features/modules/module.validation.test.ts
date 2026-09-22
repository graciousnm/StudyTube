import { describe, expect, it } from "vitest";
import { moduleIdSchema, moduleInputSchema, parseModuleInput } from "./module.validation";

describe("moduleInputSchema", () => {
  it("accepts a valid module", () => {
    const result = moduleInputSchema.safeParse({
      title: "Chord Progressions",
      description: "Common progressions.",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        title: "Chord Progressions",
        description: "Common progressions.",
      });
    }
  });

  it("trims whitespace and defaults a missing description", () => {
    const result = moduleInputSchema.safeParse({ title: "  Basics  " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ title: "Basics", description: "" });
    }
  });

  it("rejects an empty or whitespace-only title", () => {
    expect(moduleInputSchema.safeParse({ title: "" }).success).toBe(false);
    expect(moduleInputSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("rejects a title longer than 200 characters", () => {
    expect(
      moduleInputSchema.safeParse({ title: "a".repeat(201) }).success,
    ).toBe(false);
  });

  it("ignores any attempt to set ownership fields", () => {
    const form = new FormData();
    form.set("title", "Module");
    form.set("description", "Desc");
    form.set("course_id", "999");
    form.set("id", "42");
    form.set("position", "7");

    const parsed = parseModuleInput(form);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ title: "Module", description: "Desc" });
      expect(parsed.data).not.toHaveProperty("course_id");
      expect(parsed.data).not.toHaveProperty("position");
    }
  });

  it("reports field errors for invalid input", () => {
    const form = new FormData();
    form.set("title", "");

    const parsed = parseModuleInput(form);

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.fieldErrors.title?.[0]).toBe("Title is required.");
    }
  });
});

describe("moduleIdSchema", () => {
  it("accepts positive integers", () => {
    const result = moduleIdSchema.safeParse("7");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(7);
    }
  });

  it("rejects non-positive and non-numeric ids", () => {
    expect(moduleIdSchema.safeParse("0").success).toBe(false);
    expect(moduleIdSchema.safeParse("-1").success).toBe(false);
    expect(moduleIdSchema.safeParse("1.5").success).toBe(false);
    expect(moduleIdSchema.safeParse("abc").success).toBe(false);
  });
});
