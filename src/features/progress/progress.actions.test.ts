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
import { createModule } from "@/features/modules/module.mutations";
import { getLessonProgress, savePlaybackPosition } from "./progress.mutations";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

let dir: string;
let courseId: number;
let moduleId: number;
let actions: typeof import("./progress.actions");
let revalidatePath: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "studyforge-progress-actions-"));
  const databaseUrl = path.join(dir, "test.sqlite");
  const setup = createDb(databaseUrl);
  migrate(setup.db, { migrationsFolder });
  setup.close();

  process.env.DATABASE_URL = databaseUrl;
  closeDb();
  actions = await import("./progress.actions");
  revalidatePath = (await import("next/cache")).revalidatePath as unknown as ReturnType<
    typeof vi.fn
  >;
});

beforeEach(() => {
  getDb().delete(courses).run();
  vi.clearAllMocks();
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

function addLesson(videoId: string) {
  return createLesson(getDb(), moduleId, {
    youtube_video_id: videoId,
    youtube_duration: 600,
  });
}

describe("setLessonCompletedAction", () => {
  it("completes a lesson and revalidates the affected pages", async () => {
    const lesson = addLesson("aaaaaaaaaaa");

    const state = await actions.setLessonCompletedAction(
      courseId,
      moduleId,
      lesson.id,
      true,
    );

    expect(state).toEqual({ success: true });
    expect(getLessonProgress(getDb(), lesson.id)?.completed).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith(`/courses/${courseId}`);
    expect(revalidatePath).toHaveBeenCalledWith(
      `/courses/${courseId}/modules/${moduleId}`,
    );
  });

  it("uncompletes a lesson but keeps its playback position", async () => {
    const lesson = addLesson("aaaaaaaaaaa");
    savePlaybackPosition(getDb(), lesson.id, 240, 600);
    await actions.setLessonCompletedAction(courseId, moduleId, lesson.id, true);

    const state = await actions.setLessonCompletedAction(
      courseId,
      moduleId,
      lesson.id,
      false,
    );

    expect(state).toEqual({ success: true });
    expect(getLessonProgress(getDb(), lesson.id)).toMatchObject({
      completed: false,
      completed_at: null,
      playback_position_seconds: 240,
    });
  });

  it("refuses a lesson that belongs to another module", async () => {
    const otherModuleId = createModule(getDb(), courseId, {
      title: "Other",
      description: "",
    }).id;
    const lesson = createLesson(getDb(), otherModuleId, {
      youtube_video_id: "bbbbbbbbbbb",
    });

    const state = await actions.setLessonCompletedAction(
      courseId,
      moduleId,
      lesson.id,
      true,
    );

    expect(state.error).toBeDefined();
    expect(getLessonProgress(getDb(), lesson.id)).toBeUndefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("reports an unknown lesson", async () => {
    const state = await actions.setLessonCompletedAction(
      courseId,
      moduleId,
      999999,
      true,
    );
    expect(state.error).toBeDefined();
  });

  it("rejects an invalid lesson id", async () => {
    const state = await actions.setLessonCompletedAction(
      courseId,
      moduleId,
      -1,
      true,
    );
    expect(state.error).toBeDefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("savePlaybackPositionAction", () => {
  it("saves a playback position without revalidating", async () => {
    const lesson = addLesson("aaaaaaaaaaa");

    const state = await actions.savePlaybackPositionAction(lesson.id, 42, 600);

    expect(state).toEqual({ success: true });
    expect(
      getLessonProgress(getDb(), lesson.id)?.playback_position_seconds,
    ).toBe(42);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("clamps a position beyond the duration", async () => {
    const lesson = addLesson("aaaaaaaaaaa");

    await actions.savePlaybackPositionAction(lesson.id, 5000, 600);

    expect(
      getLessonProgress(getDb(), lesson.id)?.playback_position_seconds,
    ).toBe(600);
  });

  it("rejects a negative position", async () => {
    const lesson = addLesson("aaaaaaaaaaa");

    const state = await actions.savePlaybackPositionAction(lesson.id, -5, 600);

    expect(state.error).toBeDefined();
    expect(getLessonProgress(getDb(), lesson.id)).toBeUndefined();
  });

  it("reports an unknown lesson", async () => {
    const state = await actions.savePlaybackPositionAction(999999, 10, 600);
    expect(state.error).toBeDefined();
  });
});