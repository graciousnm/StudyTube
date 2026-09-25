import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DatabaseHandle, type Db } from "@/db/client";
import { courses, lessonProgress, lessons, modules, notes } from "@/db/schema";
import {
  createCourse,
  createCourseWithModules,
  createCourseWithModulesAndLessons,
  deleteCourse,
  updateCourse,
} from "./course.mutations";
import { getCourseById, getCourseByTitle, listCourses } from "./course.queries";

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

describe("course queries and mutations", () => {
  it("creates a course and reads it back", () => {
    const created = createCourse(db, {
      title: "Real Estate",
      description: "Learn the fundamentals.",
    });

    expect(created.id).toBeGreaterThan(0);
    expect(created.title).toBe("Real Estate");

    const found = getCourseById(db, created.id);
    expect(found).toMatchObject({
      id: created.id,
      title: "Real Estate",
      description: "Learn the fundamentals.",
    });
  });

  it("returns undefined for an unknown course id", () => {
    expect(getCourseById(db, 9999)).toBeUndefined();
  });

  it("lists courses in creation order", () => {
    createCourse(db, { title: "First", description: "" });
    createCourse(db, { title: "Second", description: "" });

    expect(listCourses(db).map((course) => course.title)).toEqual([
      "First",
      "Second",
    ]);
  });

  it("finds a course by exact title", () => {
    const created = createCourse(db, { title: "Real Estate", description: "" });
    expect(getCourseByTitle(db, "Real Estate")?.id).toBe(created.id);
  });

  it("matches course titles case-insensitively and trims input", () => {
    const created = createCourse(db, { title: "Worship Piano", description: "" });

    expect(getCourseByTitle(db, "worship piano")?.id).toBe(created.id);
    expect(getCourseByTitle(db, "  WORSHIP PIANO  ")?.id).toBe(created.id);
  });

  it("returns undefined when no course has the title", () => {
    createCourse(db, { title: "Real Estate", description: "" });
    expect(getCourseByTitle(db, "Real Estate Course")).toBeUndefined();
    expect(getCourseByTitle(db, " ")).toBeUndefined();
  });

  it("updates an existing course", () => {
    const created = createCourse(db, { title: "Old", description: "" });

    const updated = updateCourse(db, created.id, {
      title: "New",
      description: "Updated description",
    });

    expect(updated).toMatchObject({
      id: created.id,
      title: "New",
      description: "Updated description",
    });
    expect(getCourseById(db, created.id)?.title).toBe("New");
  });

  it("does not update an unknown course", () => {
    expect(
      updateCourse(db, 9999, { title: "Ghost", description: "" }),
    ).toBeUndefined();
    expect(listCourses(db)).toHaveLength(0);
  });

  it("deletes a course and all of its descendants", () => {
    const course = createCourse(db, { title: "Doomed", description: "" });
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
      })
      .returning()
      .get();
    db.insert(lessonProgress).values({ lesson_id: lesson.id }).run();
    db.insert(notes).values({ lesson_id: lesson.id, content: "note" }).run();

    expect(deleteCourse(db, course.id)).toBe(true);

    expect(getCourseById(db, course.id)).toBeUndefined();
    expect(db.select().from(courses).all()).toHaveLength(0);
    expect(db.select().from(modules).all()).toHaveLength(0);
    expect(db.select().from(lessons).all()).toHaveLength(0);
    expect(db.select().from(lessonProgress).all()).toHaveLength(0);
    expect(db.select().from(notes).all()).toHaveLength(0);
  });

  it("reports when deleting an unknown course", () => {
    expect(deleteCourse(db, 9999)).toBe(false);
  });

  it("does not disturb other courses when deleting one", () => {
    const keep = createCourse(db, { title: "Keep", description: "" });
    const remove = createCourse(db, { title: "Remove", description: "" });

    deleteCourse(db, remove.id);

    expect(listCourses(db).map((course) => course.id)).toEqual([keep.id]);
  });

  describe("createCourseWithModules", () => {
    it("creates a course with modules in a single transaction", () => {
      const result = createCourseWithModules(db, {
        title: "Worship Piano",
        description: "Learn worship piano.",
        modules: [
          { title: "Basics", description: "Fundamentals" },
          { title: "Chords", description: "Common progressions" },
        ],
      });

      expect(result.course.title).toBe("Worship Piano");
      expect(result.modules).toHaveLength(2);
      expect(result.modules[0].title).toBe("Basics");
      expect(result.modules[0].position).toBe(1);
      expect(result.modules[1].title).toBe("Chords");
      expect(result.modules[1].position).toBe(2);
      expect(result.modules[0].course_id).toBe(result.course.id);
      expect(result.modules[1].course_id).toBe(result.course.id);
    });

    it("creates a course with no modules", () => {
      const result = createCourseWithModules(db, {
        title: "Empty Course",
        description: "",
        modules: [],
      });

      expect(result.course.title).toBe("Empty Course");
      expect(result.modules).toHaveLength(0);
    });

    it("rolls back on error", () => {
      expect(() =>
        createCourseWithModules(db, {
          title: "Will Succeed",
          description: "",
          modules: [],
        }),
      ).not.toThrow();

      expect(listCourses(db)).toHaveLength(1);
    });
  });

  describe("createCourseWithModulesAndLessons", () => {
    it("creates a course with modules, lessons, and ordering", () => {
      const result = createCourseWithModulesAndLessons(db, {
        title: "Worship Piano",
        description: "Learn worship piano.",
        goal: "Play confidently",
        modules: [
          {
            title: "Basics",
            description: "Fundamentals",
            lessons: [
              {
                youtubeVideoId: "aaaaaaaaaaa",
                title: "First",
                durationSeconds: 120,
              },
              {
                youtubeVideoId: "bbbbbbbbbbb",
                title: "Second",
              },
            ],
          },
          {
            title: "Chords",
            description: "",
            lessons: [],
          },
        ],
      });

      expect(result.course.title).toBe("Worship Piano");
      expect(result.course.goal).toBe("Play confidently");
      expect(result.modules).toHaveLength(2);
      expect(result.modules[0].course_id).toBe(result.course.id);
      expect(result.modules[0].position).toBe(1);
      expect(result.modules[1].position).toBe(2);
      expect(result.lessonCount).toBe(2);
      expect(result.skippedDuplicates).toBe(0);

      const lessonsRows = db
        .select()
        .from(lessons)
        .all();
      expect(lessonsRows).toHaveLength(2);
      expect(lessonsRows[0]).toMatchObject({
        module_id: result.modules[0].id,
        position: 1,
        youtube_video_id: "aaaaaaaaaaa",
        youtube_duration: 120,
      });
      expect(lessonsRows[1]).toMatchObject({
        position: 2,
        youtube_video_id: "bbbbbbbbbbb",
      });
    });

    it("skips duplicate video ids within a module", () => {
      const result = createCourseWithModulesAndLessons(db, {
        title: "Deduped",
        description: "",
        modules: [
          {
            title: "M",
            description: "",
            lessons: [
              { youtubeVideoId: "aaaaaaaaaaa" },
              { youtubeVideoId: "aaaaaaaaaaa" },
              { youtubeVideoId: "bbbbbbbbbbb" },
            ],
          },
        ],
      });

      expect(result.lessonCount).toBe(2);
      expect(result.skippedDuplicates).toBe(1);

      const lessonsRows = db
        .select()
        .from(lessons)
        .all();
      expect(lessonsRows.map((row) => row.youtube_video_id)).toEqual([
        "aaaaaaaaaaa",
        "bbbbbbbbbbb",
      ]);
      expect(lessonsRows.map((row) => row.position)).toEqual([1, 2]);
    });
  });
});