import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DatabaseHandle, type Db } from "@/db/client";
import { lessonProgress, lessons, modules, notes } from "@/db/schema";
import { createCourse } from "@/features/courses/course.mutations";
import {
  createModule,
  deleteModule,
  moveModule,
  updateModule,
} from "./module.mutations";
import {
  countLessonsByModule,
  getModuleInCourse,
  listModulesByCourse,
} from "./module.queries";

let db: Db;
let close: () => void;
let courseId: number;

beforeEach(() => {
  const handle: DatabaseHandle = createDb(":memory:");
  migrate(handle.db, {
    migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
  });
  db = handle.db;
  close = handle.close;
  courseId = createCourse(db, { title: "Course", description: "" }).id;
});

afterEach(() => {
  close();
});

function positions(id: number): number[] {
  return listModulesByCourse(db, id).map((mod) => mod.position);
}

describe("createModule", () => {
  it("creates a module scoped to its course with a sequential position", () => {
    const first = createModule(db, courseId, { title: "First", description: "" });
    const second = createModule(db, courseId, {
      title: "Second",
      description: "Desc",
    });

    expect(first.course_id).toBe(courseId);
    expect(first.position).toBe(1);
    expect(second.position).toBe(2);
    expect(positions(courseId)).toEqual([1, 2]);
  });

  it("scopes positions per course", () => {
    const otherCourseId = createCourse(db, {
      title: "Other",
      description: "",
    }).id;

    createModule(db, courseId, { title: "A", description: "" });
    createModule(db, courseId, { title: "B", description: "" });
    const other = createModule(db, otherCourseId, {
      title: "C",
      description: "",
    });

    expect(other.position).toBe(1);
    expect(positions(courseId)).toEqual([1, 2]);
    expect(positions(otherCourseId)).toEqual([1]);
  });
});

describe("getModuleInCourse", () => {
  it("returns the module when it belongs to the course", () => {
    const mod = createModule(db, courseId, { title: "A", description: "" });
    expect(getModuleInCourse(db, courseId, mod.id)?.id).toBe(mod.id);
  });

  it("returns undefined when the module belongs to another course", () => {
    const otherCourseId = createCourse(db, { title: "Other", description: "" }).id;
    const mod = createModule(db, otherCourseId, { title: "A", description: "" });

    expect(getModuleInCourse(db, courseId, mod.id)).toBeUndefined();
  });
});

describe("updateModule", () => {
  it("updates title and description without changing ownership or position", () => {
    const mod = createModule(db, courseId, { title: "Old", description: "" });

    const updated = updateModule(db, mod.id, {
      title: "New",
      description: "Updated",
    });

    expect(updated).toMatchObject({
      id: mod.id,
      course_id: courseId,
      position: 1,
      title: "New",
      description: "Updated",
    });
  });

  it("returns undefined for an unknown module", () => {
    expect(
      updateModule(db, 9999, { title: "X", description: "" }),
    ).toBeUndefined();
  });
});

describe("deleteModule", () => {
  it("deletes the module and its descendants", () => {
    const mod = createModule(db, courseId, { title: "Doomed", description: "" });
    const lesson = db
      .insert(lessons)
      .values({ module_id: mod.id, position: 1, youtube_video_id: "vid1" })
      .returning()
      .get();
    db.insert(lessonProgress).values({ lesson_id: lesson.id }).run();
    db.insert(notes).values({ lesson_id: lesson.id, content: "note" }).run();

    expect(deleteModule(db, mod.id)).toBe(true);

    expect(db.select().from(modules).all()).toHaveLength(0);
    expect(db.select().from(lessons).all()).toHaveLength(0);
    expect(db.select().from(lessonProgress).all()).toHaveLength(0);
    expect(db.select().from(notes).all()).toHaveLength(0);
  });

  it("reports an unknown module", () => {
    expect(deleteModule(db, 9999)).toBe(false);
  });
});

describe("moveModule", () => {
  it("swaps a module upward and keeps positions contiguous", () => {
    createModule(db, courseId, { title: "A", description: "" });
    const b = createModule(db, courseId, { title: "B", description: "" });
    createModule(db, courseId, { title: "C", description: "" });

    expect(moveModule(db, b.id, "up")).toBe(true);

    expect(listModulesByCourse(db, courseId).map((m) => m.title)).toEqual([
      "B",
      "A",
      "C",
    ]);
    expect(positions(courseId)).toEqual([1, 2, 3]);
  });

  it("swaps a module downward", () => {
    const a = createModule(db, courseId, { title: "A", description: "" });
    createModule(db, courseId, { title: "B", description: "" });

    expect(moveModule(db, a.id, "down")).toBe(true);

    expect(listModulesByCourse(db, courseId).map((m) => m.title)).toEqual([
      "B",
      "A",
    ]);
    expect(positions(courseId)).toEqual([1, 2]);
  });

  it("does not move the first module up or the last module down", () => {
    const a = createModule(db, courseId, { title: "A", description: "" });
    const b = createModule(db, courseId, { title: "B", description: "" });

    expect(moveModule(db, a.id, "up")).toBe(false);
    expect(moveModule(db, b.id, "down")).toBe(false);
    expect(listModulesByCourse(db, courseId).map((m) => m.title)).toEqual([
      "A",
      "B",
    ]);
  });

  it("only reorders modules within their own course", () => {
    const otherCourseId = createCourse(db, { title: "Other", description: "" }).id;
    const a = createModule(db, courseId, { title: "A", description: "" });
    const b = createModule(db, courseId, { title: "B", description: "" });
    const other = createModule(db, otherCourseId, {
      title: "Other",
      description: "",
    });

    moveModule(db, other.id, "up");

    expect(listModulesByCourse(db, courseId).map((m) => m.title)).toEqual([
      "A",
      "B",
    ]);
    expect(listModulesByCourse(db, otherCourseId).map((m) => m.title)).toEqual([
      "Other",
    ]);
    expect([a.position, b.position]).toEqual([1, 2]);
  });

  it("returns false for an unknown module", () => {
    expect(moveModule(db, 9999, "up")).toBe(false);
  });
});

describe("countLessonsByModule", () => {
  it("counts lessons per module within a course", () => {
    const withLessons = createModule(db, courseId, {
      title: "With",
      description: "",
    });
    const empty = createModule(db, courseId, { title: "Empty", description: "" });

    db.insert(lessons)
      .values({ module_id: withLessons.id, position: 1, youtube_video_id: "a" })
      .run();
    db.insert(lessons)
      .values({ module_id: withLessons.id, position: 2, youtube_video_id: "b" })
      .run();

    const counts = countLessonsByModule(db, courseId);

    expect(counts.get(withLessons.id)).toBe(2);
    expect(counts.get(empty.id)).toBeUndefined();
  });
});
