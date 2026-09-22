import { describe, expect, it } from "vitest";
import { learnerNameSchema, parseProfileName } from "./profile.validation";

function formName(value: string): FormData {
  const data = new FormData();
  data.set("name", value);
  return data;
}

describe("learnerNameSchema", () => {
  it("accepts a trimmed non-empty name", () => {
    expect(learnerNameSchema.parse("  Alice  ")).toBe("Alice");
  });

  it("rejects an empty or whitespace-only name", () => {
    expect(learnerNameSchema.safeParse("").success).toBe(false);
    expect(learnerNameSchema.safeParse("   ").success).toBe(false);
  });

  it("rejects names longer than 60 characters", () => {
    expect(learnerNameSchema.safeParse("a".repeat(61)).success).toBe(false);
    expect(learnerNameSchema.safeParse("a".repeat(60)).success).toBe(true);
  });
});

describe("parseProfileName", () => {
  it("returns the trimmed name on success", () => {
    const result = parseProfileName(formName("  Learner  "));
    expect(result).toEqual({ success: true, data: "Learner" });
  });

  it("returns field errors for invalid input", () => {
    const result = parseProfileName(formName("  "));
    expect(result).toEqual({
      success: false,
      fieldErrors: { name: ["Name is required."] },
    });
  });
});