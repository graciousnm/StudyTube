import path from "node:path";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DatabaseHandle, type Db } from "@/db/client";
import { lessonProgress } from "@/db/schema";
import { createCourse } from "@/features/courses/course.mutations";
import {
  createLesson,
  deleteLesson,
  moveLesson,
} from "@/features/lessons/lesson.mutations";
import { createModule } from "@/features/modules/module.mutations";
import {
  markLessonComplete,
  savePlaybackPosition,
} from "./progress.mutations";
import {
  getContinueLearning,
  getCourseProgress,
  getCourseProgressMap,
  getLessonProgressMap,
  getModuleProgress,
  getModuleProgressMap,
} from "./progress.queries";

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

function makeLesson(moduleId: number, videoId: string, duration = 600) {
  return createLesson(db, moduleId, {
    youtube_video_id: videoId,
    youtube_title: videoId,
    youtube_duration: duration,
  });
}

function watch(lessonId: number, position: number) {
  savePlaybackPosition(db, lessonId, position, 600);
}

function backdate(lessonId: number, millis: number) {
  db.update(lessonProgress)
    .set({ updated_at: new Date(Date.now() - millis) })
    .where(eq(lessonProgress.lesson_id, lessonId))
    .run();
}

describe("getCourseProgress", () => {
  it("returns an empty state for a course with no lessons", () => {
    const course = makeCourse("Empty");
    expect(getCourseProgress(db, course.id)).toMatchObject({
      completed: 0,
      total: 0,
      isEmpty: true,
      percent: null,
    });
  });

  it("counts lessons across every module", () => {
    const course = makeCourse("Course");
    const first = makeModule(course.id, "One");
    const second = makeModule(course.id, "Two");
    makeLesson(first.id, "aaaaaaaaaaa");
    const secondLesson = makeLesson(first.id, "bbbbbbbbbbb");
    makeLesson(second.id, "ccccccccccc");

    markLessonComplete(db, secondLesson.id);

    expect(getCourseProgress(db, course.id)).toMatchObject({
      completed: 1,
      total: 3,
      percent: 33,
      isComplete: false,
      isEmpty: false,
    });
  });

  it("reports 100 percent when every lesson is complete", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "One");
    const first = makeLesson(mod.id, "aaaaaaaaaaa");
    const second = makeLesson(mod.id, "bbbbbbbbbbb");
    markLessonComplete(db, first.id);
    markLessonComplete(db, second.id);

    expect(getCourseProgress(db, course.id)).toMatchObject({
      completed: 2,
      total: 2,
      percent: 100,
      isComplete: true,
    });
  });
});

describe("getModuleProgress", () => {
  it("reports an empty module", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Empty");
    expect(getModuleProgress(db, mod.id).isEmpty).toBe(true);
  });

  it("reports partial and complete modules", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const first = makeLesson(mod.id, "aaaaaaaaaaa");
    const second = makeLesson(mod.id, "bbbbbbbbbbb");

    markLessonComplete(db, first.id);
    expect(getModuleProgress(db, mod.id)).toMatchObject({
      completed: 1,
      total: 2,
      percent: 50,
      isComplete: false,
    });

    markLessonComplete(db, second.id);
    expect(getModuleProgress(db, mod.id)).toMatchObject({
      completed: 2,
      total: 2,
      percent: 100,
      isComplete: true,
    });
  });
});

describe("progress maps", () => {
  it("maps course progress by course", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const lesson = makeLesson(mod.id, "aaaaaaaaaaa");
    markLessonComplete(db, lesson.id);

    expect(getCourseProgressMap(db).get(course.id)).toMatchObject({
      completed: 1,
      total: 1,
    });
  });

  it("maps module progress by module for one course", () => {
    const course = makeCourse("Course");
    const first = makeModule(course.id, "One");
    const second = makeModule(course.id, "Two");
    const lesson = makeLesson(first.id, "aaaaaaaaaaa");
    markLessonComplete(db, lesson.id);

    const map = getModuleProgressMap(db, course.id);
    expect(map.get(first.id)).toMatchObject({ completed: 1, total: 1 });
    expect(map.get(second.id)).toBeUndefined();
  });

  it("maps lesson progress for a module", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const lesson = makeLesson(mod.id, "aaaaaaaaaaa");
    watch(lesson.id, 30);

    const map = getLessonProgressMap(db, mod.id);
    expect(map.get(lesson.id)?.playback_position_seconds).toBe(30);
  });
});

describe("getContinueLearning", () => {
  it("returns nothing when there are no lessons", () => {
    expect(getContinueLearning(db)).toBeUndefined();
  });

  it("falls back to the first incomplete lesson without marking it started", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const first = makeLesson(mod.id, "aaaaaaaaaaa");
    makeLesson(mod.id, "bbbbbbbbbbb");

    const item = getContinueLearning(db);
    expect(item?.lesson.id).toBe(first.id);
    expect(item?.started).toBe(false);
    expect(item?.course.id).toBe(course.id);
  });

  it("resumes the most recently watched incomplete lesson", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const first = makeLesson(mod.id, "aaaaaaaaaaa");
    const second = makeLesson(mod.id, "bbbbbbbbbbb");

    watch(first.id, 120);
    backdate(first.id, 120_000);
    watch(second.id, 60);

    const item = getContinueLearning(db);
    expect(item?.lesson.id).toBe(second.id);
    expect(item?.started).toBe(true);
  });

  it("ignores completed lessons when resuming", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const completed = makeLesson(mod.id, "aaaaaaaaaaa");
    const active = makeLesson(mod.id, "bbbbbbbbbbb");

    watch(completed.id, 300);
    markLessonComplete(db, completed.id);
    watch(active.id, 90);

    expect(getContinueLearning(db)?.lesson.id).toBe(active.id);
  });

  it("returns nothing when every lesson is complete", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const first = makeLesson(mod.id, "aaaaaaaaaaa");
    const second = makeLesson(mod.id, "bbbbbbbbbbb");
    markLessonComplete(db, first.id);
    markLessonComplete(db, second.id);

    expect(getContinueLearning(db)).toBeUndefined();
  });

  it("prefers the most recently watched lesson across courses", () => {
    const firstCourse = makeCourse("First");
    const firstModule = makeModule(firstCourse.id, "Module");
    const firstLesson = makeLesson(firstModule.id, "aaaaaaaaaaa");
    const secondCourse = makeCourse("Second");
    const secondModule = makeModule(secondCourse.id, "Module");
    const secondLesson = makeLesson(secondModule.id, "bbbbbbbbbbb");

    watch(firstLesson.id, 30);
    backdate(firstLesson.id, 60_000);
    watch(secondLesson.id, 45);

    const item = getContinueLearning(db);
    expect(item?.course.id).toBe(secondCourse.id);
    expect(item?.lesson.id).toBe(secondLesson.id);
  });

  it("falls back to curriculum order across courses", () => {
    const firstCourse = makeCourse("First");
    const firstModule = makeModule(firstCourse.id, "Module");
    const firstLesson = makeLesson(firstModule.id, "aaaaaaaaaaa");
    const secondCourse = makeCourse("Second");
    const secondModule = makeModule(secondCourse.id, "Module");
    makeLesson(secondModule.id, "bbbbbbbbbbb");

    expect(getContinueLearning(db)?.lesson.id).toBe(firstLesson.id);
  });

  it("scopes resume to a course when asked", () => {
    const firstCourse = makeCourse("First");
    const firstModule = makeModule(firstCourse.id, "Module");
    const firstLesson = makeLesson(firstModule.id, "aaaaaaaaaaa");
    const secondCourse = makeCourse("Second");
    const secondModule = makeModule(secondCourse.id, "Module");
    makeLesson(secondModule.id, "bbbbbbbbbbb");

    expect(
      getContinueLearning(db, { courseId: secondCourse.id })?.lesson.module_id,
    ).toBe(secondModule.id);
    expect(
      getContinueLearning(db, { courseId: firstCourse.id })?.lesson.id,
    ).toBe(firstLesson.id);
  });

  it("scopes resume to a module when asked", () => {
    const course = makeCourse("Course");
    const firstModule = makeModule(course.id, "First");
    const firstLesson = makeLesson(firstModule.id, "aaaaaaaaaaa");
    const secondModule = makeModule(course.id, "Second");
    const secondLesson = makeLesson(secondModule.id, "bbbbbbbbbbb");

    watch(firstLesson.id, 120);
    backdate(firstLesson.id, 120_000);
    watch(secondLesson.id, 60);

    const item = getContinueLearning(db, { moduleId: firstModule.id });
    expect(item?.lesson.id).toBe(firstLesson.id);
    expect(item?.started).toBe(true);
  });

  it("ignores watched lessons in other modules", () => {
    const course = makeCourse("Course");
    const firstModule = makeModule(course.id, "First");
    const firstLesson = makeLesson(firstModule.id, "aaaaaaaaaaa");
    const secondModule = makeModule(course.id, "Second");
    const secondLesson = makeLesson(secondModule.id, "bbbbbbbbbbb");

    watch(firstLesson.id, 120);

    const item = getContinueLearning(db, { moduleId: secondModule.id });
    expect(item?.lesson.id).toBe(secondLesson.id);
    expect(item?.lesson.module_id).toBe(secondModule.id);
  });

  it("falls back to the first incomplete lesson within a module when asked", () => {
    const course = makeCourse("Course");
    const firstModule = makeModule(course.id, "First");
    makeLesson(firstModule.id, "aaaaaaaaaaa");
    const secondModule = makeModule(course.id, "Second");
    const firstInSecond = makeLesson(secondModule.id, "bbbbbbbbbbb");
    makeLesson(secondModule.id, "ccccccccccc");

    const item = getContinueLearning(db, { moduleId: secondModule.id });
    expect(item?.lesson.id).toBe(firstInSecond.id);
    expect(item?.started).toBe(false);
  });

  it("returns nothing for a completed module when asked", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const first = makeLesson(mod.id, "aaaaaaaaaaa");
    const second = makeLesson(mod.id, "bbbbbbbbbbb");
    markLessonComplete(db, first.id);
    markLessonComplete(db, second.id);

    expect(getContinueLearning(db, { moduleId: mod.id })).toBeUndefined();
  });
});

describe("progress across curriculum changes", () => {
  it("makes a completed course incomplete again when a lesson is added", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const lesson = makeLesson(mod.id, "aaaaaaaaaaa");
    markLessonComplete(db, lesson.id);
    expect(getCourseProgress(db, course.id).isComplete).toBe(true);

    makeLesson(mod.id, "bbbbbbbbbbb");
    expect(getCourseProgress(db, course.id)).toMatchObject({
      completed: 1,
      total: 2,
      isComplete: false,
    });
  });

  it("removes progress when a lesson is deleted", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const first = makeLesson(mod.id, "aaaaaaaaaaa");
    const second = makeLesson(mod.id, "bbbbbbbbbbb");
    markLessonComplete(db, first.id);
    markLessonComplete(db, second.id);

    deleteLesson(db, first.id);

    expect(getLessonProgressMap(db, mod.id).has(first.id)).toBe(false);
    expect(getCourseProgress(db, course.id)).toMatchObject({
      completed: 1,
      total: 1,
      isComplete: true,
    });
  });

  it("keeps progress attached to a lesson when it is reordered", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const first = makeLesson(mod.id, "aaaaaaaaaaa");
    const second = makeLesson(mod.id, "bbbbbbbbbbb");
    markLessonComplete(db, first.id);

    moveLesson(db, second.id, "up");

    expect(getCourseProgress(db, course.id)).toMatchObject({
      completed: 1,
      total: 2,
    });
    expect(getLessonProgressMap(db, mod.id).get(first.id)?.completed).toBe(
      true,
    );
    expect(getLessonProgressMap(db, mod.id).has(second.id)).toBe(false);
  });
});