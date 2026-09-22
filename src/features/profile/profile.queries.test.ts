import path from "node:path";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DatabaseHandle, type Db } from "@/db/client";
import { lessonProgress } from "@/db/schema";
import { createCourse } from "@/features/courses/course.mutations";
import { createLesson } from "@/features/lessons/lesson.mutations";
import { createModule } from "@/features/modules/module.mutations";
import {
  markLessonComplete,
  savePlaybackPosition,
} from "@/features/progress/progress.mutations";
import { createProfile, updateProfileName } from "./profile.mutations";
import { getLearnerStats, getProfile } from "./profile.queries";

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

function watch(lesson: number | { id: number }, position: number) {
  savePlaybackPosition(db, toId(lesson), position, 600);
}

function complete(lesson: number | { id: number }) {
  markLessonComplete(db, toId(lesson));
}

function toId(lesson: number | { id: number }): number {
  return typeof lesson === "number" ? lesson : lesson.id;
}

function backdate(lesson: number | { id: number }, daysAgo: number) {
  db.update(lessonProgress)
    .set({ updated_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) })
    .where(eq(lessonProgress.lesson_id, toId(lesson)))
    .run();
}

describe("getProfile", () => {
  it("is single-row: reads and updates the row with id 1", () => {
    expect(getProfile(db)).toBeUndefined();

    const created = createProfile(db, "Learner");
    expect(getProfile(db)).toMatchObject({ id: 1, name: "Learner" });
    expect(created.id).toBe(1);

    const updated = updateProfileName(db, "Renamed");
    expect(updated?.name).toBe("Renamed");
    expect(getProfile(db)?.name).toBe("Renamed");
  });

  it("reports undefined when no profile exists", () => {
    expect(updateProfileName(db, "Nobody")).toBeUndefined();
  });
});

describe("getLearnerStats", () => {
  it("returns empty stats for an empty installation", () => {
    expect(getLearnerStats(db)).toMatchObject({
      totalLessons: 0,
      completedLessons: 0,
      inProgressLessons: 0,
      notStartedLessons: 0,
      percent: null,
      overallComplete: false,
      workedMinutes: 0,
      daysTouched: 0,
      courseEntries: [],
      mostInProgress: undefined,
      mostCurrent: undefined,
    });
  });

  it("derives lesson buckets, percent, and worked minutes", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const completed = makeLesson(mod.id, "aaaaaaaaaaa", 600);
    const inProgress = makeLesson(mod.id, "bbbbbbbbbbb", 1200);
    makeLesson(mod.id, "ccccccccccc", 180);

    complete(completed);
    watch(inProgress, 300);

    const stats = getLearnerStats(db);

    expect(stats.totalLessons).toBe(3);
    expect(stats.completedLessons).toBe(1);
    expect(stats.inProgressLessons).toBe(1);
    expect(stats.notStartedLessons).toBe(1);
    expect(stats.percent).toBe(33);
    expect(stats.overallComplete).toBe(false);
    expect(stats.workedMinutes).toBe(10);
    expect(stats.daysTouched).toBe(1);
  });

  it("truncates worked minutes down", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const underAMinute = makeLesson(mod.id, "aaaaaaaaaaa", 59);
    const aMinute = makeLesson(mod.id, "bbbbbbbbbbb", 119);
    const chunky = makeLesson(mod.id, "ccccccccccc", 1201);

    complete(underAMinute);
    complete(aMinute);
    complete(chunky);

    expect(getLearnerStats(db).workedMinutes).toBe(22);
  });

  it("counts distinct days touched across progress rows", () => {
    const course = makeCourse("Course");
    const mod = makeModule(course.id, "Module");
    const day0 = makeLesson(mod.id, "aaaaaaaaaaa");
    const day2 = makeLesson(mod.id, "bbbbbbbbbbb");
    const day5 = makeLesson(mod.id, "ccccccccccc");

    watch(day0, 10);
    backdate(day0, 0);
    watch(day2, 20);
    backdate(day2, 2);
    watch(day5, 30);
    backdate(day5, 5);

    expect(getLearnerStats(db).daysTouched).toBe(3);
  });

  it("classifies course states: completed, in progress, not started", () => {
    const completedCourse = makeCourse("Completed");
    const completedModule = makeModule(completedCourse.id, "Module");
    const a = makeLesson(completedModule.id, "aaaaaaaaaaa");
    const b = makeLesson(completedModule.id, "bbbbbbbbbbb");
    complete(a);
    complete(b);

    const startedCourse = makeCourse("Started");
    const startedModule = makeModule(startedCourse.id, "Module");
    const c = makeLesson(startedModule.id, "ccccccccccc");
    const d = makeLesson(startedModule.id, "ddddddddddd");
    complete(c);
    void d;

    makeCourse("Untouched");

    const stats = getLearnerStats(db);
    const byTitle = new Map(
      stats.courseEntries.map((entry) => [entry.title, entry.state]),
    );

    expect(byTitle.get("Completed")).toBe("completed");
    expect(byTitle.get("Started")).toBe("in_progress");
    expect(byTitle.get("Untouched")).toBe("not_started");
  });

  it("treats playback-only courses as not started (spec literal)", () => {
    const course = makeCourse("Watched Only");
    const mod = makeModule(course.id, "Module");
    watch(makeLesson(mod.id, "aaaaaaaaaaa").id, 300);

    const stats = getLearnerStats(db);
    expect(stats.courseEntries[0]).toMatchObject({
      title: "Watched Only",
      state: "not_started",
    });
  });

  it("picks the highest-percentage in-progress course as most in progress", () => {
    const lower = makeCourse("Lower");
    const lowerModule = makeModule(lower.id, "Module");
    complete(makeLesson(lowerModule.id, "aaaaaaaaaaa").id);
    complete(makeLesson(lowerModule.id, "bbbbbbbbbbb").id);
    makeLesson(lowerModule.id, "fffffffffff");

    const higher = makeCourse("Higher");
    const higherModule = makeModule(higher.id, "Module");
    complete(makeLesson(higherModule.id, "ccccccccccc").id);
    complete(makeLesson(higherModule.id, "ddddddddddd").id);
    complete(makeLesson(higherModule.id, "eeeeeeeeeee").id);
    makeLesson(higherModule.id, "ggggggggggg");

    const stats = getLearnerStats(db);
    expect(stats.mostInProgress?.title).toBe("Higher");
  });

  it("excludes completed courses from most in progress", () => {
    const course = makeCourse("Done");
    const mod = makeModule(course.id, "Module");
    complete(makeLesson(mod.id, "aaaaaaaaaaa").id);

    const stats = getLearnerStats(db);
    expect(stats.mostInProgress).toBeUndefined();
  });

  it("reports the most recently touched course as most current", () => {
    const older = makeCourse("Older");
    const olderModule = makeModule(older.id, "Module");
    const olderLesson = makeLesson(olderModule.id, "aaaaaaaaaaa");
    complete(olderLesson);
    backdate(olderLesson.id, 9);

    const newer = makeCourse("Newer");
    const newerModule = makeModule(newer.id, "Module");
    const newerLesson = makeLesson(newerModule.id, "bbbbbbbbbbb");
    watch(newerLesson.id, 10);
    backdate(newerLesson.id, 1);

    const stats = getLearnerStats(db);
    expect(stats.mostCurrent?.title).toBe("Newer");
  });
});