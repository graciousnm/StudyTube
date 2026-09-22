import path from "node:path";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DatabaseHandle, type Db } from "./client";
import {
  courses,
  lessonProgress,
  lessons,
  modules,
  notes,
  profile,
} from "./schema";

function createTestDb(): DatabaseHandle {
  const handle = createDb(":memory:");
  migrate(handle.db, {
    migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
  });
  return handle;
}

let db: Db;
let close: () => void;

beforeEach(() => {
  const handle = createTestDb();
  db = handle.db;
  close = handle.close;
});

afterEach(() => {
  close();
});

describe("database schema", () => {
  it("applies migrations and stores a course", () => {
    const course = db
      .insert(courses)
      .values({ title: "Real Estate" })
      .returning()
      .get();

    expect(course.id).toBeGreaterThan(0);
    expect(course.title).toBe("Real Estate");
    expect(course.description).toBe("");
    expect(course.created_at).toBeInstanceOf(Date);
    expect(course.updated_at).toBeInstanceOf(Date);
  });

  it("enforces a non-empty progress relation with a unique lesson_id", () => {
    const course = db.insert(courses).values({ title: "Course" }).returning().get();
    const mod = db
      .insert(modules)
      .values({ course_id: course.id, title: "Module", position: 1 })
      .returning()
      .get();
    const lesson = db
      .insert(lessons)
      .values({
        module_id: mod.id,
        position: 1,
        youtube_video_id: "abc123",
        youtube_title: "Intro",
      })
      .returning()
      .get();

    db.insert(lessonProgress).values({ lesson_id: lesson.id }).run();

    expect(() =>
      db.insert(lessonProgress).values({ lesson_id: lesson.id }).run(),
    ).toThrow();

    expect(
      db
        .select()
        .from(lessonProgress)
        .where(eq(lessonProgress.lesson_id, lesson.id))
        .get(),
    ).toMatchObject({
      lesson_id: lesson.id,
      playback_position_seconds: 0,
      completed: false,
      completed_at: null,
    });
  });

  it("rejects a lesson whose module does not exist (FK enforcement)", () => {
    expect(() =>
      db
        .insert(lessons)
        .values({ module_id: 999, position: 1, youtube_video_id: "abc123" })
        .run(),
    ).toThrow();
  });

  it("prevents duplicate positions within a module", () => {
    const course = db.insert(courses).values({ title: "Course" }).returning().get();
    const mod = db
      .insert(modules)
      .values({ course_id: course.id, title: "Module", position: 1 })
      .returning()
      .get();

    db.insert(lessons)
      .values({ module_id: mod.id, position: 1, youtube_video_id: "aaa" })
      .run();

    expect(() =>
      db
        .insert(lessons)
        .values({ module_id: mod.id, position: 1, youtube_video_id: "bbb" })
        .run(),
    ).toThrow();

    db.insert(lessons)
      .values({ module_id: mod.id, position: 2, youtube_video_id: "bbb" })
      .run();
  });

  it("prevents duplicate positions within a course", () => {
    const course = db.insert(courses).values({ title: "Course" }).returning().get();

    db.insert(modules).values({ course_id: course.id, title: "A", position: 1 }).run();

    expect(() =>
      db.insert(modules).values({ course_id: course.id, title: "B", position: 1 }).run(),
    ).toThrow();

    db.insert(modules).values({ course_id: course.id, title: "B", position: 2 }).run();
  });

  it("allows the same position on different parents", () => {
    const course = db.insert(courses).values({ title: "Course" }).returning().get();
    const moduleA = db
      .insert(modules)
      .values({ course_id: course.id, title: "A", position: 1 })
      .returning()
      .get();
    const moduleB = db
      .insert(modules)
      .values({ course_id: course.id, title: "B", position: 2 })
      .returning()
      .get();

    db.insert(lessons)
      .values({ module_id: moduleA.id, position: 1, youtube_video_id: "aaa" })
      .run();
    db.insert(lessons)
      .values({ module_id: moduleB.id, position: 1, youtube_video_id: "bbb" })
      .run();
  });

  it("rejects the same YouTube video twice within a module", () => {
    const course = db.insert(courses).values({ title: "Course" }).returning().get();
    const mod = db
      .insert(modules)
      .values({ course_id: course.id, title: "Module", position: 1 })
      .returning()
      .get();

    db.insert(lessons)
      .values({ module_id: mod.id, position: 1, youtube_video_id: "abc123" })
      .run();

    expect(() =>
      db
        .insert(lessons)
        .values({ module_id: mod.id, position: 2, youtube_video_id: "abc123" })
        .run(),
    ).toThrow();
  });

  it("allows the same YouTube video in a different module", () => {
    const course = db.insert(courses).values({ title: "Course" }).returning().get();
    const moduleA = db
      .insert(modules)
      .values({ course_id: course.id, title: "A", position: 1 })
      .returning()
      .get();
    const moduleB = db
      .insert(modules)
      .values({ course_id: course.id, title: "B", position: 2 })
      .returning()
      .get();

    db.insert(lessons)
      .values({ module_id: moduleA.id, position: 1, youtube_video_id: "abc123" })
      .run();
    db.insert(lessons)
      .values({ module_id: moduleB.id, position: 1, youtube_video_id: "abc123" })
      .run();
  });

  it("stores a single local learner profile row", () => {
    const installed = db
      .insert(profile)
      .values({ id: 1, name: "Learner" })
      .returning()
      .get();

    expect(installed).toMatchObject({ id: 1, name: "Learner" });
    expect(installed.created_at).toBeInstanceOf(Date);
    expect(installed.updated_at).toBeInstanceOf(Date);

    expect(() =>
      db.insert(profile).values({ id: 1, name: "Again" }).run(),
    ).toThrow();
  });

  it("cascades course deletion through modules, lessons, progress, and notes", () => {
    const course = db.insert(courses).values({ title: "Course" }).returning().get();
    const mod = db
      .insert(modules)
      .values({ course_id: course.id, title: "Module", position: 1 })
      .returning()
      .get();
    const lesson = db
      .insert(lessons)
      .values({ module_id: mod.id, position: 1, youtube_video_id: "abc123" })
      .returning()
      .get();

    db.insert(lessonProgress).values({ lesson_id: lesson.id }).run();
    db.insert(notes)
      .values({ lesson_id: lesson.id, content: "remember this" })
      .run();

    db.delete(courses).where(eq(courses.id, course.id)).run();

    expect(db.select().from(courses).get()).toBeUndefined();
    expect(db.select().from(modules).get()).toBeUndefined();
    expect(db.select().from(lessons).get()).toBeUndefined();
    expect(db.select().from(lessonProgress).get()).toBeUndefined();
    expect(db.select().from(notes).get()).toBeUndefined();
  });

  it("cascades lesson deletion through progress and notes", () => {
    const course = db.insert(courses).values({ title: "Course" }).returning().get();
    const mod = db
      .insert(modules)
      .values({ course_id: course.id, title: "Module", position: 1 })
      .returning()
      .get();
    const lesson = db
      .insert(lessons)
      .values({ module_id: mod.id, position: 1, youtube_video_id: "abc123" })
      .returning()
      .get();

    db.insert(lessonProgress).values({ lesson_id: lesson.id }).run();
    db.insert(notes).values({ lesson_id: lesson.id, content: "note" }).run();

    db.delete(lessons).where(eq(lessons.id, lesson.id)).run();

    expect(db.select().from(lessons).get()).toBeUndefined();
    expect(db.select().from(lessonProgress).get()).toBeUndefined();
    expect(db.select().from(notes).get()).toBeUndefined();
    expect(db.select().from(modules).get()).toBeDefined();
  });
});