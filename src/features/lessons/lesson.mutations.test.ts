import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DatabaseHandle, type Db } from "@/db/client";
import { lessonProgress, lessons, notes } from "@/db/schema";
import { createCourse } from "@/features/courses/course.mutations";
import { createModule } from "@/features/modules/module.mutations";
import {
  createLesson,
  deleteLesson,
  moveLesson,
} from "./lesson.mutations";
import {
  findLessonByVideoId,
  getLessonInModule,
  listLessonsByModule,
} from "./lesson.queries";

let db: Db;
let close: () => void;
let moduleId: number;

beforeEach(() => {
  const handle: DatabaseHandle = createDb(":memory:");
  migrate(handle.db, {
    migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
  });
  db = handle.db;
  close = handle.close;
  const course = createCourse(db, { title: "Course", description: "" });
  moduleId = createModule(db, course.id, {
    title: "Module",
    description: "",
  }).id;
});

afterEach(() => {
  close();
});

function addLesson(videoId: string, title = videoId) {
  return createLesson(db, moduleId, {
    youtube_video_id: videoId,
    youtube_title: title,
    youtube_channel_name: "Channel",
    youtube_duration: 754,
  });
}

describe("createLesson", () => {
  it("creates a lesson with sequential positions and preserved metadata", () => {
    const first = addLesson("aaaaaaaaaaa", "First");
    const second = addLesson("bbbbbbbbbbb", "Second");

    expect(first).toMatchObject({
      module_id: moduleId,
      position: 1,
      youtube_video_id: "aaaaaaaaaaa",
      youtube_title: "First",
      youtube_channel_name: "Channel",
      youtube_duration: 754,
    });
    expect(second.position).toBe(2);
    expect(listLessonsByModule(db, moduleId).map((l) => l.position)).toEqual([
      1, 2,
    ]);
  });

  it("allows the same video in different modules", () => {
    const otherModuleId = createModule(
      db,
      createCourse(db, { title: "Other", description: "" }).id,
      { title: "Other", description: "" },
    ).id;

    addLesson("duplicate123");
    createLesson(db, otherModuleId, { youtube_video_id: "duplicate123" });

    expect(findLessonByVideoId(db, moduleId, "duplicate123")).toBeDefined();
    expect(findLessonByVideoId(db, otherModuleId, "duplicate123")).toBeDefined();
  });

  it("rejects the same video twice in one module", () => {
    addLesson("samemodule11");

    expect(() => addLesson("samemodule11")).toThrow();
    expect(listLessonsByModule(db, moduleId)).toHaveLength(1);
  });
});

describe("getLessonInModule", () => {
  it("finds a lesson in its module and rejects other modules", () => {
    const lesson = addLesson("findme12345");
    const otherModuleId = createModule(
      db,
      createCourse(db, { title: "Other", description: "" }).id,
      { title: "Other", description: "" },
    ).id;

    expect(getLessonInModule(db, moduleId, lesson.id)?.id).toBe(lesson.id);
    expect(getLessonInModule(db, otherModuleId, lesson.id)).toBeUndefined();
  });
});

describe("deleteLesson", () => {
  it("deletes the lesson and its progress and notes", () => {
    const lesson = addLesson("deleteme123");
    db.insert(lessonProgress).values({ lesson_id: lesson.id }).run();
    db.insert(notes).values({ lesson_id: lesson.id, content: "note" }).run();

    expect(deleteLesson(db, lesson.id)).toBe(true);

    expect(db.select().from(lessons).all()).toHaveLength(0);
    expect(db.select().from(lessonProgress).all()).toHaveLength(0);
    expect(db.select().from(notes).all()).toHaveLength(0);
  });

  it("reports an unknown lesson", () => {
    expect(deleteLesson(db, 9999)).toBe(false);
  });
});

describe("moveLesson", () => {
  it("reorders lessons within the module and keeps positions contiguous", () => {
    addLesson("aaaaaaaaaaa", "A");
    const b = addLesson("bbbbbbbbbbb", "B");
    addLesson("ccccccccccc", "C");

    expect(moveLesson(db, b.id, "up")).toBe(true);

    expect(listLessonsByModule(db, moduleId).map((l) => l.youtube_title)).toEqual([
      "B",
      "A",
      "C",
    ]);
    expect(listLessonsByModule(db, moduleId).map((l) => l.position)).toEqual([
      1, 2, 3,
    ]);
  });

  it("does not move the first lesson up or the last lesson down", () => {
    const a = addLesson("aaaaaaaaaaa", "A");
    const b = addLesson("bbbbbbbbbbb", "B");

    expect(moveLesson(db, a.id, "up")).toBe(false);
    expect(moveLesson(db, b.id, "down")).toBe(false);
    expect(listLessonsByModule(db, moduleId).map((l) => l.youtube_title)).toEqual([
      "A",
      "B",
    ]);
  });

  it("does not reorder lessons in another module", () => {
    const otherModuleId = createModule(
      db,
      createCourse(db, { title: "Other", description: "" }).id,
      { title: "Other", description: "" },
    ).id;
    const a = addLesson("aaaaaaaaaaa", "A");
    const b = addLesson("bbbbbbbbbbb", "B");
    addLesson("zzzzzzzzzzz", "Z");
    createLesson(db, otherModuleId, { youtube_video_id: "other111111" });

    moveLesson(db, a.id, "down");

    expect(listLessonsByModule(db, moduleId).map((l) => l.youtube_title)).toEqual([
      "B",
      "A",
      "Z",
    ]);
    const refreshed = listLessonsByModule(db, moduleId).find(
      (l) => l.id === b.id,
    );
    expect(refreshed?.position).toBe(1);
    expect(listLessonsByModule(db, otherModuleId)).toHaveLength(1);
  });

  it("returns false for an unknown lesson", () => {
    expect(moveLesson(db, 9999, "up")).toBe(false);
  });
});
