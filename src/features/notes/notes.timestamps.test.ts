import { describe, expect, it } from "vitest";
import {
  parseNoteTimestamps,
  segmentNoteContent,
} from "./notes.timestamps";

describe("parseNoteTimestamps", () => {
  it("extracts [MM:SS] timestamps", () => {
    expect(parseNoteTimestamps("See [01:30] and [1:05]")).toEqual([
      { text: "[01:30]", seconds: 90 },
      { text: "[1:05]", seconds: 65 },
    ]);
  });

  it("extracts [H:MM:SS] timestamps", () => {
    expect(parseNoteTimestamps("Long video [1:02:03]")).toEqual([
      { text: "[1:02:03]", seconds: 3723 },
    ]);
  });

  it("ignores malformed and out-of-range tokens", () => {
    expect(parseNoteTimestamps("[1:99] [99:1] [abc] 12:30")).toEqual([]);
  });

  it("returns nothing for plain text", () => {
    expect(parseNoteTimestamps("no timestamps here")).toEqual([]);
    expect(parseNoteTimestamps("")).toEqual([]);
  });

  it("matches the last of duplicate texts by treating tokens as unique", () => {
    const notes = parseNoteTimestamps("[0:30] [0:30]");
    expect(notes).toHaveLength(2);
    expect(notes[0].seconds).toBe(30);
    expect(notes[1].seconds).toBe(30);
  });
});

describe("segmentNoteContent", () => {
  it("splits text around timestamp tokens", () => {
    expect(segmentNoteContent("Start [0:10] middle [1:00] end")).toEqual([
      { type: "text", text: "Start " },
      { type: "timestamp", text: "[0:10]", seconds: 10 },
      { type: "text", text: " middle " },
      { type: "timestamp", text: "[1:00]", seconds: 60 },
      { type: "text", text: " end" },
    ]);
  });

  it("keeps a leading timestamp first in the segment list", () => {
    expect(segmentNoteContent("[0:05] intro")).toEqual([
      { type: "timestamp", text: "[0:05]", seconds: 5 },
      { type: "text", text: " intro" },
    ]);
  });

  it("returns plain text segment when nothing matches", () => {
    expect(segmentNoteContent("Just words")).toEqual([
      { type: "text", text: "Just words" },
    ]);
    expect(segmentNoteContent("")).toEqual([]);
  });

  it("skips out-of-range timestamps while keeping the rest", () => {
    expect(segmentNoteContent("a [0:99] b")).toEqual([
      { type: "text", text: "a [0:99] b" },
    ]);
  });
});