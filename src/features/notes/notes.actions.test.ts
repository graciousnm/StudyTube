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
import { courses, notes } from "@/db/schema";
import { createCourse } from "@/features/courses/course.mutations";
import { createLesson } from "@/features/lessons/lesson.mutations";
import { createModule } from "@/features/modules/module.mutations";
import { saveNote } from "./notes.mutations";
import { getNoteByLesson } from "./notes.queries";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

let dir: string;
let courseId: number;
let moduleId: number;
let lessonId: number;
let actions: typeof import("./notes.actions");
let revalidatePath: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "studyforge-notes-actions-"));
  const databaseUrl = path.join(dir, "test.sqlite");
  const setup = createDb(databaseUrl);
  migrate(setup.db, { migrationsFolder });
  setup.close();

  process.env.DATABASE_URL = databaseUrl;
  closeDb();
  actions = await import("./notes.actions");
  revalidatePath = (await import("next/cache")).revalidatePath as unknown as ReturnType<
    typeof vi.fn
  >;
});

beforeEach(() => {
  getDb().delete(courses).run();
  vi.clearAllMocks();
  courseId = createCourse(getDb(), { title: "Course", description: "" }).id;
  moduleId = createModule(getDb(), courseId, {
    title: "Module",
    description: "",
  }).id;
  lessonId = createLesson(getDb(), moduleId, {
    youtube_video_id: "aaaaaaaaaaa",
  }).id;
});

afterAll(() => {
  closeDb();
  rmSync(dir, { recursive: true, force: true });
});

function noteForm(content: string): FormData {
  const data = new FormData();
  data.set("content", content);
  return data;
}

const lessonPath = () =>
  `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`;

describe("saveNoteAction", () => {
  it("creates a note and revalidates the lesson page", async () => {
    const state = await actions.saveNoteAction(
      courseId,
      moduleId,
      lessonId,
      {},
      noteForm("  practice slowly  "),
    );

    expect(state).toEqual({});
    expect(getNoteByLesson(getDb(), lessonId)?.content).toBe("practice slowly");
    expect(revalidatePath).toHaveBeenCalledWith(lessonPath());
  });

  it("upserts: saving again updates the single note and revalidates", async () => {
    saveNote(getDb(), lessonId, "old");

    const state = await actions.saveNoteAction(
      courseId,
      moduleId,
      lessonId,
      {},
      noteForm("new"),
    );

    expect(state).toEqual({});
    const stored = getNoteByLesson(getDb(), lessonId);
    expect(stored).toMatchObject({ content: "new" });
    expect(getDb().select().from(notes).all()).toHaveLength(1);
    expect(revalidatePath).toHaveBeenCalledWith(lessonPath());
  });

  it("returns a content error and creates nothing for empty input", async () => {
    const state = await actions.saveNoteAction(
      courseId,
      moduleId,
      lessonId,
      {},
      noteForm("   "),
    );

    expect(state.fieldErrors?.content).toBeDefined();
    expect(getNoteByLesson(getDb(), lessonId)).toBeUndefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("refuses a lesson that belongs to another module", async () => {
    const otherModuleId = createModule(getDb(), courseId, {
      title: "Other",
      description: "",
    }).id;
    const otherLesson = createLesson(getDb(), otherModuleId, {
      youtube_video_id: "bbbbbbbbbbb",
    });

    const state = await actions.saveNoteAction(
      courseId,
      moduleId,
      otherLesson.id,
      {},
      noteForm("sneaky"),
    );

    expect(state.error).toBeDefined();
    expect(getNoteByLesson(getDb(), otherLesson.id)).toBeUndefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("reports an unknown lesson", async () => {
    const state = await actions.saveNoteAction(
      courseId,
      moduleId,
      999999,
      {},
      noteForm("hello"),
    );
    expect(state.error).toBeDefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects an invalid lesson id", async () => {
    const state = await actions.saveNoteAction(
      courseId,
      moduleId,
      -1,
      {},
      noteForm("hello"),
    );
    expect(state.error).toBeDefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteNoteAction", () => {
  it("deletes the note and revalidates the lesson page", async () => {
    saveNote(getDb(), lessonId, "doomed");

    const state = await actions.deleteNoteAction(
      courseId,
      moduleId,
      lessonId,
    );

    expect(state).toEqual({});
    expect(getNoteByLesson(getDb(), lessonId)).toBeUndefined();
    expect(revalidatePath).toHaveBeenCalledWith(lessonPath());
  });

  it("is idempotent when the lesson has no note", async () => {
    const state = await actions.deleteNoteAction(
      courseId,
      moduleId,
      lessonId,
    );

    expect(state).toEqual({});
    expect(revalidatePath).toHaveBeenCalledWith(lessonPath());
  });

  it("reports an unknown lesson", async () => {
    const state = await actions.deleteNoteAction(
      courseId,
      moduleId,
      999999,
    );
    expect(state.error).toBeDefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects an invalid lesson id", async () => {
    const state = await actions.deleteNoteAction(courseId, moduleId, -1);
    expect(state.error).toBeDefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});