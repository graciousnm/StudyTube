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
import { getLessonInModule, listLessonsByModule } from "@/features/lessons/lesson.queries";
import { createModule } from "@/features/modules/module.mutations";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

let dir: string;
let databaseUrl: string;
let courseId: number;
let moduleId: number;
let actions: typeof import("./lesson.actions");

async function expectRedirect(
  promise: Promise<unknown>,
  expected: RegExp,
): Promise<string> {
  let message: string | undefined;
  try {
    await promise;
  } catch (error) {
    message = (error as Error).message;
  }
  expect(message, "expected the action to redirect").toBeDefined();
  expect(message).toMatch(expected);
  return message as string;
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "studyforge-lesson-actions-"));
  databaseUrl = path.join(dir, "test.sqlite");
  const setup = createDb(databaseUrl);
  migrate(setup.db, { migrationsFolder });
  setup.close();

  process.env.DATABASE_URL = databaseUrl;
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
});

afterAll(() => {
  closeDb();
  rmSync(dir, { recursive: true, force: true });
});

function addLesson(videoId: string) {
  return createLesson(getDb(), moduleId, { youtube_video_id: videoId });
}

describe("deleteLessonAction", () => {
  it("removes a lesson and redirects to the module", async () => {
    const lesson = addLesson("deleteme123");

    await expectRedirect(
      actions.deleteLessonAction(courseId, moduleId, lesson.id),
      new RegExp(`^REDIRECT:/courses/${courseId}/modules/${moduleId}$`),
    );

    expect(listLessonsByModule(getDb(), moduleId)).toHaveLength(0);
  });

  it("refuses to remove a lesson from another module", async () => {
    const otherModuleId = createModule(getDb(), courseId, {
      title: "Other",
      description: "",
    }).id;
    const lesson = createLesson(getDb(), otherModuleId, {
      youtube_video_id: "othervideo1",
    });

    const state = await actions.deleteLessonAction(
      courseId,
      moduleId,
      lesson.id,
    );

    expect(state.error).toBeDefined();
    expect(
      getLessonInModule(getDb(), otherModuleId, lesson.id),
    ).toBeDefined();
  });

  it("reports an unknown lesson", async () => {
    const state = await actions.deleteLessonAction(courseId, moduleId, 999999);
    expect(state.error).toBeDefined();
  });
});

describe("moveLessonAction", () => {
  it("reorders lessons without redirecting", async () => {
    addLesson("aaaaaaaaaaa");
    const second = addLesson("bbbbbbbbbbb");
    addLesson("ccccccccccc");

    await expect(
      actions.moveLessonAction(courseId, moduleId, second.id, "up"),
    ).resolves.toBeUndefined();

    expect(
      listLessonsByModule(getDb(), moduleId).map((l) => l.youtube_video_id),
    ).toEqual(["bbbbbbbbbbb", "aaaaaaaaaaa", "ccccccccccc"]);
  });

  it("ignores a lesson that belongs to another module", async () => {
    const otherModuleId = createModule(getDb(), courseId, {
      title: "Other",
      description: "",
    }).id;
    addLesson("aaaaaaaaaaa");
    const otherLesson = createLesson(getDb(), otherModuleId, {
      youtube_video_id: "othervideo1",
    });

    await actions.moveLessonAction(courseId, moduleId, otherLesson.id, "up");

    expect(listLessonsByModule(getDb(), moduleId)).toHaveLength(1);
    expect(listLessonsByModule(getDb(), otherModuleId)).toHaveLength(1);
  });
});
