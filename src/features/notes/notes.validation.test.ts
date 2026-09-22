import { describe, expect, it } from "vitest";
import { MAX_NOTE_LENGTH } from "./notes.types";
import { noteContentSchema, parseNoteInput } from "./notes.validation";

describe("noteContentSchema", () => {
  it("trims surrounding whitespace", () => {
    expect(noteContentSchema.parse("  hello  ")).toBe("hello");
  });

  it("rejects empty and whitespace-only content", () => {
    expect(noteContentSchema.safeParse("").success).toBe(false);
    expect(noteContentSchema.safeParse("   \n\t ").success).toBe(false);
  });

  it("accepts content exactly at the maximum length", () => {
    expect(noteContentSchema.safeParse("x".repeat(MAX_NOTE_LENGTH)).success).toBe(
      true,
    );
  });

  it("rejects content beyond the maximum length", () => {
    expect(
      noteContentSchema.safeParse("x".repeat(MAX_NOTE_LENGTH + 1)).success,
    ).toBe(false);
  });

  it("rejects non-string content", () => {
    expect(noteContentSchema.safeParse(null).success).toBe(false);
    expect(noteContentSchema.safeParse(42).success).toBe(false);
  });

  it("keeps script-like text verbatim as plain text", () => {
    const content = '<script>alert("test")</script>';
    expect(noteContentSchema.parse(content)).toBe(content);
  });
});

describe("parseNoteInput", () => {
  function form(value: string | null): FormData {
    const data = new FormData();
    if (value !== null) {
      data.set("content", value);
    }
    return data;
  }

  it("returns trimmed content for valid input", () => {
    const parsed = parseNoteInput(form("  remember the bridge  "));
    expect(parsed).toEqual({
      success: true,
      data: { content: "remember the bridge" },
    });
  });

  it("reports a content error for empty input", () => {
    const parsed = parseNoteInput(form("   "));
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.fieldErrors.content).toBeDefined();
    }
  });

  it("reports a content error when content is missing", () => {
    const parsed = parseNoteInput(form(null));
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.fieldErrors.content).toBeDefined();
    }
  });

  it("reports a content error above the maximum length", () => {
    const parsed = parseNoteInput(form("x".repeat(MAX_NOTE_LENGTH + 1)));
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.fieldErrors.content).toBeDefined();
    }
  });
});