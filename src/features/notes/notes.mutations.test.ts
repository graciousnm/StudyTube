import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DatabaseHandle, type Db } from "@/db/client";
import { notes } from "@/db/schema";
import { createCourse } from "@/features/courses/course.mutations";
import { createLesson, deleteLesson } from "@/features/lessons/lesson.mutations";
import { createModule } from "@/features/modules/module.mutations";
import { getCourseProgress } from "@/features/progress/progress.queries";
import {
  getLessonProgress,
  markLessonComplete,
  savePlaybackPosition,
} from "@/features/progress/progress.mutations";
import { deleteNote, saveNote } from "./notes.mutations";
import { getNoteByLesson } from "./notes.queries";

let db: Db;
let close: () => void;
let courseId: number;
let lessonId: number;
let otherLessonId: number;

beforeEach(() => {
  const handle: DatabaseHandle = createDb(":memory:");
  migrate(handle.db, {
    migrationsFolder: path.join(process.cwd(), "src/db/migrations"),
  });
  db = handle.db;
  close = handle.close;

  courseId = createCourse(db, { title: "Course", description: "" }).id;
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

describe("saveNote", () => {
  it("stores plain text scoped to the lesson", () => {
    const note = saveNote(db, lessonId, "Practice the 1-4-5-6 progression.");

    expect(note).toMatchObject({
      lesson_id: lessonId,
      content: "Practice the 1-4-5-6 progression.",
    });
    expect(note.created_at).toBeInstanceOf(Date);
    expect(note.updated_at).toBeInstanceOf(Date);
    expect(getNoteByLesson(db, lessonId)).toMatchObject({
      content: "Practice the 1-4-5-6 progression.",
    });
  });

  it("upserts: saving twice keeps a single note and replaces the content", () => {
    const first = saveNote(db, lessonId, "first");
    const second = saveNote(db, lessonId, "second");

    const stored = db.select().from(notes).all();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ id: first.id, content: "second" });
    expect(second.id).toBe(first.id);
  });

  it("keeps notes across different lessons independent", () => {
    saveNote(db, lessonId, "lesson note");
    const other = saveNote(db, otherLessonId, "other note");

    expect(getNoteByLesson(db, lessonId)?.content).toBe("lesson note");
    expect(getNoteByLesson(db, otherLessonId)?.content).toBe("other note");
    expect(other.lesson_id).toBe(otherLessonId);
  });

  it("enforces one note per lesson via the unique index", () => {
    function insertRow(token: string) {
      db.insert(notes)
        .values({
          lesson_id: lessonId,
          content: token,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .run();
    }

    insertRow("row one");

    expect(() => insertRow("row two")).toThrow(/UNIQUE/i);
  });
});

describe("deleteNote", () => {
  it("removes the lesson's note", () => {
    saveNote(db, lessonId, "doomed");

    expect(deleteNote(db, lessonId)).toBe(true);
    expect(getNoteByLesson(db, lessonId)).toBeUndefined();
  });

  it("keeps the note of another lesson", () => {
    saveNote(db, otherLessonId, "keep me");

    expect(deleteNote(db, lessonId)).toBe(false);
    expect(getNoteByLesson(db, otherLessonId)?.content).toBe("keep me");
  });

  it("returns false when the lesson has no note", () => {
    expect(deleteNote(db, lessonId)).toBe(false);
  });
});

describe("cascade behavior", () => {
  it("removes a lesson's note when the lesson is deleted", () => {
    saveNote(db, lessonId, "one");

    expect(deleteLesson(db, lessonId)).toBe(true);

    expect(db.select().from(notes).all()).toHaveLength(0);
  });
});

describe("independence from progress", () => {
  it("does not change completion, playback position or course progress", () => {
    savePlaybackPosition(db, lessonId, 120, 600);
    markLessonComplete(db, otherLessonId);

    const progressBefore = getLessonProgress(db, lessonId);
    const otherProgressBefore = getLessonProgress(db, otherLessonId);
    const courseBefore = getCourseProgress(db, courseId);

    saveNote(db, lessonId, "first");
    saveNote(db, lessonId, "edited");
    deleteNote(db, lessonId);
    saveNote(db, lessonId, "unrelated");

    expect(getLessonProgress(db, lessonId)).toEqual(progressBefore);
    expect(getLessonProgress(db, otherLessonId)).toEqual(otherProgressBefore);
    expect(getCourseProgress(db, courseId)).toEqual(courseBefore);
  });
});