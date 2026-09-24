import { describe, expect, it } from "vitest";
import { extractVideoId, extractPlaylistId } from "./youtube.url";

describe("extractVideoId", () => {
  it("accepts a raw 11-char video ID", () => {
    expect(extractVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("trims whitespace", () => {
    expect(extractVideoId("  dQw4w9WgXcQ  ")).toBe("dQw4w9WgXcQ");
  });

  it("parses youtube.com/watch?v= URLs", () => {
    expect(
      extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("parses youtu.be short URLs", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("parses youtube.com/embed/ URLs", () => {
    expect(
      extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("parses youtube.com/v/ URLs", () => {
    expect(extractVideoId("https://www.youtube.com/v/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("parses youtube.com/shorts/ URLs", () => {
    expect(
      extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("ignores extra query params like list and t", () => {
    expect(
      extractVideoId(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxxx&t=30",
      ),
    ).toBe("dQw4w9WgXcQ");
  });

  it("parses m.youtube.com URLs", () => {
    expect(
      extractVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("returns null for invalid URLs", () => {
    expect(extractVideoId("https://example.com")).toBeNull();
    expect(extractVideoId("not a url")).toBeNull();
    expect(extractVideoId("")).toBeNull();
  });

  it("returns null for URLs without a video ID", () => {
    expect(extractVideoId("https://www.youtube.com")).toBeNull();
    expect(extractVideoId("https://www.youtube.com/watch")).toBeNull();
  });
});

describe("extractPlaylistId", () => {
  it("parses playlist?list= URLs", () => {
    expect(
      extractPlaylistId(
        "https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
      ),
    ).toBe("PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf");
  });

  it("parses watch?v=...&list= URLs", () => {
    expect(
      extractPlaylistId(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
      ),
    ).toBe("PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf");
  });

  it("parses youtu.be URLs with list param", () => {
    expect(
      extractPlaylistId(
        "https://youtu.be/dQw4w9WgXcQ?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
      ),
    ).toBe("PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf");
  });

  it("returns null for URLs without list param", () => {
    expect(
      extractPlaylistId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBeNull();
  });

  it("returns null for invalid URLs", () => {
    expect(extractPlaylistId("not a url")).toBeNull();
    expect(extractPlaylistId("")).toBeNull();
  });

  it("rejects list params on non-YouTube hosts", () => {
    expect(
      extractPlaylistId(
        "https://evil.example.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
      ),
    ).toBeNull();
  });
});
