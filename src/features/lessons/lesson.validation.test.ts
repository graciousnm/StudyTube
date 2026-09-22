import { describe, expect, it } from "vitest";
import { lessonIdSchema } from "./lesson.validation";

describe("lessonIdSchema", () => {
  it("accepts positive integers", () => {
    const result = lessonIdSchema.safeParse("12");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(12);
    }
  });

  it("rejects non-positive and non-numeric ids", () => {
    expect(lessonIdSchema.safeParse("0").success).toBe(false);
    expect(lessonIdSchema.safeParse("-4").success).toBe(false);
    expect(lessonIdSchema.safeParse("2.5").success).toBe(false);
    expect(lessonIdSchema.safeParse("video").success).toBe(false);
  });
});
