import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DatabaseHandle, type Db } from "@/db/client";
import { createCourse } from "@/features/courses/course.mutations";
import { createLesson, moveLesson } from "@/features/lessons/lesson.mutations";
import { createModule, moveModule } from "@/features/modules/module.mutations";
import { getLearningContext } from "./learning.queries";

let db: Db;
let close: () => void;

beforeEach(() => {
  const handle: DatabaseHandle = createDb(":memory:");
  migrate(handle.db, {
    migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
  });
  db = handle.db;
  close = handle.close;
});

afterEach(() => {
  close();
});

function makeCourse(title: string) {
  return createCourse(db, { title, description: "" });
}

function makeModule(courseId: number, title: string) {
  return createModule(db, courseId, { title, description: "" });
}

function makeLesson(moduleId: number, videoId: string, title?: string) {
  return createLesson(db, moduleId, {
    youtube_video_id: videoId,
    youtube_title: title,
  });
}

describe("getLearningContext", () => {
  let courseId: number;
  let firstModuleId: number;
  let secondModuleId: number;
  let first: ReturnType<typeof makeLesson>;
  let second: ReturnType<typeof makeLesson>;
  let third: ReturnType<typeof makeLesson>;

  beforeEach(() => {
    const course = makeCourse("Course");
    courseId = course.id;
    firstModuleId = makeModule(course.id, "First").id;
    secondModuleId = makeModule(course.id, "Second").id;
    first = makeLesson(firstModuleId, "aaaaaaaaaaa", "First Lesson");
    second = makeLesson(firstModuleId, "bbbbbbbbbbb", "Second Lesson");
    third = makeLesson(secondModuleId, "ccccccccccc", "Third Lesson");
  });

  it("returns the course, module, and lesson context", () => {
    const context = getLearningContext(
      db,
      courseId,
      firstModuleId,
      second.id,
    );

    expect(context?.course.id).toBe(courseId);
    expect(context?.module.id).toBe(firstModuleId);
    expect(context?.lesson.id).toBe(second.id);
    expect(context?.lessonNumber).toBe(2);
    expect(context?.lessonCount).toBe(2);
  });

  it("links to the previous and next lesson within a module", () => {
    const context = getLearningContext(
      db,
      courseId,
      firstModuleId,
      second.id,
    );

    expect(context?.previous).toMatchObject({
      lessonId: first.id,
      moduleId: firstModuleId,
      courseId,
    });
    expect(context?.next).toMatchObject({
      lessonId: third.id,
      moduleId: secondModuleId,
      courseId,
    });
  });

  it("crosses module boundaries in curriculum order", () => {
    const context = getLearningContext(
      db,
      courseId,
      secondModuleId,
      third.id,
    );

    expect(context?.previous?.lessonId).toBe(second.id);
    expect(context?.next).toBeUndefined();
  });

  it("has no previous lesson for the first lesson", () => {
    const context = getLearningContext(db, courseId, firstModuleId, first.id);
    expect(context?.previous).toBeUndefined();
    expect(context?.next?.lessonId).toBe(second.id);
  });

  it("falls back to the video id when a lesson has no title", () => {
    const untitled = makeLesson(firstModuleId, "ddddddddddd");
    const context = getLearningContext(
      db,
      courseId,
      firstModuleId,
      second.id,
    );

    expect(context?.next?.lessonId).toBe(untitled.id);
    expect(context?.next?.title).toBe("ddddddddddd");
  });

  it("follows persisted lesson position order", () => {
    moveLesson(db, second.id, "up");

    const context = getLearningContext(
      db,
      courseId,
      firstModuleId,
      second.id,
    );

    expect(context?.lessonNumber).toBe(1);
    expect(context?.previous).toBeUndefined();
    expect(context?.next?.lessonId).toBe(first.id);
  });

  it("follows persisted module position order", () => {
    moveModule(db, secondModuleId, "up");

    const context = getLearningContext(db, courseId, firstModuleId, first.id);

    expect(context?.previous?.lessonId).toBe(third.id);
    expect(context?.previous?.moduleId).toBe(secondModuleId);
    expect(context?.next?.lessonId).toBe(second.id);
  });

  it("does not include lessons from another course", () => {
    const otherCourse = makeCourse("Other");
    const otherModule = makeModule(otherCourse.id, "Other Module");
    makeLesson(otherModule.id, "eeeeeeeeeee", "Other Lesson");

    expect(
      getLearningContext(db, courseId, secondModuleId, third.id)?.next,
    ).toBeUndefined();
  });

  it("returns undefined for invalid requests", () => {
    expect(getLearningContext(db, 999999, firstModuleId, first.id)).toBeUndefined();
    expect(getLearningContext(db, courseId, 999999, first.id)).toBeUndefined();
    expect(getLearningContext(db, courseId, firstModuleId, 999999)).toBeUndefined();
  });

  it("returns undefined when the lesson is not in the module", () => {
    expect(
      getLearningContext(db, courseId, firstModuleId, third.id),
    ).toBeUndefined();
  });

  it("returns undefined when the module is not in the course", () => {
    const otherCourse = makeCourse("Other");
    const otherModule = makeModule(otherCourse.id, "Other Module");
    makeLesson(otherModule.id, "eeeeeeeeeee");

    expect(
      getLearningContext(db, courseId, otherModule.id, first.id),
    ).toBeUndefined();
  });
});