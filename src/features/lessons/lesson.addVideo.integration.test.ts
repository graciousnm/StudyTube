import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { closeDb, createDb, getDb } from "@/db/client";
import { courses } from "@/db/schema";
import { createCourse } from "@/features/courses/course.mutations";
import { listLessonsByModule } from "@/features/lessons/lesson.queries";
import { createModule } from "@/features/modules/module.mutations";
import { searchYouTube } from "@/features/youtube/youtube.search";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

const VIDEO_SNIPPET = {
  title: "Normalized Title",
  channelId: "channel-abc",
  channelTitle: "Normalized Channel",
  description: "Normalized description",
  publishedAt: "2024-02-03T04:05:06.000Z",
  thumbnails: {
    medium: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg" },
  },
};

const SEARCH_RESPONSE = {
  items: [
    {
      id: { videoId: "dQw4w9WgXcQ" },
      snippet: VIDEO_SNIPPET,
    },
  ],
};

const VIDEOS_RESPONSE = {
  items: [
    {
      id: "dQw4w9WgXcQ",
      snippet: VIDEO_SNIPPET,
      contentDetails: { duration: "PT14M32S" },
    },
  ],
};

let dir: string;
let databaseUrl: string;
let courseId: number;
let moduleId: number;
let actions: typeof import("./lesson.actions");

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "studyforge-add-video-int-"));
  databaseUrl = path.join(dir, "test.sqlite");
  const setup = createDb(databaseUrl);
  migrate(setup.db, { migrationsFolder });
  setup.close();

  process.env.DATABASE_URL = databaseUrl;
  process.env.YOUTUBE_API_KEY = "TESTKEY";
  closeDb();
  actions = await import("./lesson.actions");
});

beforeEach(() => {
  getDb().delete(courses).run();
  courseId = createCourse(getDb(), { title: "Course", description: "" }).id;
  moduleId = createModule(getDb(), courseId, {
    title: "Module",
    description: "",
  }).id;

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/videos")) {
        return new Response(JSON.stringify(VIDEOS_RESPONSE), { status: 200 });
      }
      return new Response(JSON.stringify(SEARCH_RESPONSE), { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(() => {
  delete process.env.YOUTUBE_API_KEY;
  closeDb();
  rmSync(dir, { recursive: true, force: true });
});

describe("search and add integration", () => {
  it("creates a lesson from a normalized search result", async () => {
    const results = await searchYouTube("normalized");
    expect(results).toHaveLength(1);

    const selected = results[0];
    const state = await actions.addVideoToModuleAction(
      courseId,
      moduleId,
      selected.youtubeVideoId,
    );

    expect(state).toEqual({ success: true });
    const lessons = listLessonsByModule(getDb(), moduleId);
    expect(lessons).toHaveLength(1);
    expect(lessons[0]).toMatchObject({
      youtube_video_id: "dQw4w9WgXcQ",
      youtube_title: "Normalized Title",
      youtube_channel_id: "channel-abc",
      youtube_channel_name: "Normalized Channel",
      youtube_thumbnail_url:
        "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      youtube_duration: 872,
      youtube_description: "Normalized description",
      youtube_published_at: new Date("2024-02-03T04:05:06.000Z"),
      position: 1,
    });
  });

  it("does not create a lesson while searching", async () => {
    await searchYouTube("normalized");
    expect(listLessonsByModule(getDb(), moduleId)).toHaveLength(0);
  });
});