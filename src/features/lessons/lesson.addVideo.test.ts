import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import {
  afterAll,
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
import { createLesson } from "@/features/lessons/lesson.mutations";
import { listLessonsByModule } from "@/features/lessons/lesson.queries";
import { createModule } from "@/features/modules/module.mutations";
import { YouTubeError } from "@/features/youtube/youtube.errors";
import type { YouTubeVideo } from "@/features/youtube/youtube.types";

const getVideoMetadataMock = vi.fn();

vi.mock("@/features/youtube/youtube.search", () => ({
  getVideoMetadata: getVideoMetadataMock,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

let dir: string;
let databaseUrl: string;
let courseId: number;
let moduleId: number;
let actions: typeof import("./lesson.actions");

const VIDEO: YouTubeVideo = {
  youtubeVideoId: "dQw4w9WgXcQ",
  title: "An Example Video",
  channelId: "channel-123",
  channelName: "Channel Name",
  thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
  durationSeconds: 823,
  description: "A description.",
  publishedAt: new Date("2024-05-01T00:00:00.000Z"),
};

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "studytube-add-video-"));
  databaseUrl = path.join(dir, "test.sqlite");
  const setup = createDb(databaseUrl);
  migrate(setup.db, { migrationsFolder });
  setup.close();

  process.env.DATABASE_URL = databaseUrl;
  closeDb();
  actions = await import("./lesson.actions");
});

beforeEach(() => {
  getVideoMetadataMock.mockReset();
  getVideoMetadataMock.mockResolvedValue(VIDEO);
  getDb().delete(courses).run();
  courseId = createCourse(getDb(), { title: "Course", description: "" }).id;
  moduleId = createModule(getDb(), courseId, {
    title: "Module",
    description: "",
  }).id;
});

afterAll(() => {
  closeDb();
  rmSync(dir, { recursive: true, force: true });
});

describe("addVideoToModuleAction", () => {
  it("adds a new video with its YouTube metadata", async () => {
    const state = await actions.addVideoToModuleAction(
      courseId,
      moduleId,
      VIDEO.youtubeVideoId,
    );

    expect(state).toEqual({ success: true });
    const lessons = listLessonsByModule(getDb(), moduleId);
    expect(lessons).toHaveLength(1);
    expect(lessons[0]).toMatchObject({
      youtube_video_id: VIDEO.youtubeVideoId,
      youtube_title: VIDEO.title,
      youtube_channel_id: VIDEO.channelId,
      youtube_channel_name: VIDEO.channelName,
      youtube_thumbnail_url: VIDEO.thumbnailUrl,
      youtube_duration: VIDEO.durationSeconds,
      youtube_description: VIDEO.description,
      youtube_published_at: VIDEO.publishedAt,
      position: 1,
    });
    expect(getVideoMetadataMock).toHaveBeenCalledOnce();
  });

  it("rejects a video already in the same module", async () => {
    createLesson(getDb(), moduleId, {
      youtube_video_id: VIDEO.youtubeVideoId,
    });

    const state = await actions.addVideoToModuleAction(
      courseId,
      moduleId,
      VIDEO.youtubeVideoId,
    );

    expect(state.error).toContain("already in this module");
    expect(getVideoMetadataMock).not.toHaveBeenCalled();
    expect(listLessonsByModule(getDb(), moduleId)).toHaveLength(1);
  });

  it("allows the same video in a different module", async () => {
    const otherModuleId = createModule(getDb(), courseId, {
      title: "Other",
      description: "",
    }).id;
    createLesson(getDb(), otherModuleId, {
      youtube_video_id: VIDEO.youtubeVideoId,
    });

    const state = await actions.addVideoToModuleAction(
      courseId,
      moduleId,
      VIDEO.youtubeVideoId,
    );

    expect(state).toEqual({ success: true });
    expect(listLessonsByModule(getDb(), moduleId)).toHaveLength(1);
  });

  it("rejects a video that is unavailable on YouTube", async () => {
    getVideoMetadataMock.mockRejectedValue(
      new YouTubeError(
        "video_unavailable",
        "This video is unavailable on YouTube.",
      ),
    );

    const state = await actions.addVideoToModuleAction(
      courseId,
      moduleId,
      "zzzzzzzzzzz",
    );

    expect(state.error).toContain("unavailable");
    expect(listLessonsByModule(getDb(), moduleId)).toHaveLength(0);
  });

  it("keeps the curriculum intact when YouTube fails", async () => {
    getVideoMetadataMock.mockRejectedValue(new Error("network down"));

    const state = await actions.addVideoToModuleAction(
      courseId,
      moduleId,
      VIDEO.youtubeVideoId,
    );

    expect(state.error).toBeDefined();
    expect(listLessonsByModule(getDb(), moduleId)).toHaveLength(0);
  });

  it("rejects an invalid video id without calling YouTube", async () => {
    const state = await actions.addVideoToModuleAction(
      courseId,
      moduleId,
      "not-a-real-id",
    );

    expect(state.error).toBeDefined();
    expect(getVideoMetadataMock).not.toHaveBeenCalled();
  });

  it("reports a module that no longer exists", async () => {
    const state = await actions.addVideoToModuleAction(
      courseId,
      999999,
      VIDEO.youtubeVideoId,
    );

    expect(state.error).toBeDefined();
    expect(getVideoMetadataMock).not.toHaveBeenCalled();
  });
});