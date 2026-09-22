import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DatabaseHandle, type Db } from "@/db/client";
import { createCourse } from "@/features/courses/course.mutations";
import { createLesson } from "@/features/lessons/lesson.mutations";
import { createModule } from "@/features/modules/module.mutations";
import { saveNote } from "./notes.mutations";
import { getNoteByLesson } from "./notes.queries";

let db: Db;
let close: () => void;
let lessonId: number;
let otherLessonId: number;

beforeEach(() => {
  const handle: DatabaseHandle = createDb(":memory:");
  migrate(handle.db, {
    migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
  });
  db = handle.db;
  close = handle.close;

  const courseId = createCourse(db, { title: "Course", description: "" }).id;
  const moduleId = createModule(db, courseId, {
    title: "Module",
    description: "",
  }).id;
  lessonId = createLesson(db, moduleId, { youtube_video_id: "aaaaaaaaaaa" }).id;
  otherLessonId = createLesson(db, moduleId, {
    youtube_video_id: "bbbbbbbbbbb",
  }).id;
});

afterEach(() => {
  close();
});

describe("getNoteByLesson", () => {
  it("returns undefined when the lesson has no note", () => {
    expect(getNoteByLesson(db, lessonId)).toBeUndefined();
  });

  it("returns the lesson's single note", () => {
    saveNote(db, lessonId, "remember the bridge");

    expect(getNoteByLesson(db, lessonId)).toMatchObject({
      lesson_id: lessonId,
      content: "remember the bridge",
    });
  });

  it("is scoped to the lesson", () => {
    saveNote(db, otherLessonId, "other lesson");

    expect(getNoteByLesson(db, lessonId)).toBeUndefined();
    expect(getNoteByLesson(db, otherLessonId)?.content).toBe("other lesson");
  });
});