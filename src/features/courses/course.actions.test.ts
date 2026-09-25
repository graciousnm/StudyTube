import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
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
import { closeDb, createDb, getDb, type Db } from "@/db/client";
import { courses, lessons, modules } from "@/db/schema";
import { createCourse } from "./course.mutations";
import { createModule } from "@/features/modules/module.mutations";
import { listCourses } from "./course.queries";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

let dir: string;
let databaseUrl: string;
let actions: typeof import("./course.actions");
let revalidatePath: ReturnType<typeof vi.fn>;

function openDb(): { db: Db; close: () => void } {
  return createDb(databaseUrl);
}

function form(
  title: string,
  description: string,
  goal?: string,
): FormData {
  const data = new FormData();
  data.set("title", title);
  data.set("description", description);
  if (goal !== undefined) {
    data.set("goal", goal);
  }
  return data;
}

async function expectRedirect(
  promise: Promise<unknown>,
  expected: RegExp,
): Promise<string> {
  let message: string | undefined;
  try {
    await promise;
  } catch (error) {
    message = (error as Error).message;
  }
  expect(message, "expected the action to redirect").toBeDefined();
  expect(message).toMatch(expected);
  return message as string;
}

function onlyCourseId(): number {
  const handle = openDb();
  const rows = listCourses(handle.db);
  handle.close();
  return rows[0].id;
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "studyforge-actions-"));
  databaseUrl = path.join(dir, "test.sqlite");
  const setup = createDb(databaseUrl);
  migrate(setup.db, { migrationsFolder });
  setup.close();

  process.env.DATABASE_URL = databaseUrl;
  closeDb();
  delete (globalThis as { __studyforgeDb?: unknown }).__studyforgeDb;
  actions = await import("./course.actions");
  revalidatePath = (await import("next/cache")).revalidatePath as unknown as ReturnType<
    typeof vi.fn
  >;
});

beforeEach(() => {
  getDb().delete(courses).run();
  vi.clearAllMocks();
});

afterAll(() => {
  closeDb();
  rmSync(dir, { recursive: true, force: true });
});

describe("createCourseAction", () => {
  it("persists a valid course and revalidates home", async () => {
    const state = await actions.createCourseAction(
      {},
      form("Real Estate", "Learn the basics."),
    );

    expect(state).toEqual({});
    expect(revalidatePath).toHaveBeenCalledWith("/");

    const handle = openDb();
    const rows = listCourses(handle.db);
    handle.close();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      title: "Real Estate",
      description: "Learn the basics.",
    });
  });

  it("persists an optional learning goal", async () => {
    const state = await actions.createCourseAction(
      {},
      form("Worship Piano", "Chords and progressions.", "Play with confidence"),
    );

    expect(state).toEqual({});
    const handle = openDb();
    const rows = listCourses(handle.db);
    handle.close();
    expect(rows[0].goal).toBe("Play with confidence");
  });

  it("returns field errors and persists nothing for invalid input", async () => {
    const state = await actions.createCourseAction({}, form("   ", "no title"));

    expect(state.error).toBeDefined();
    expect(state.fieldErrors?.title).toBeDefined();

    const handle = openDb();
    expect(listCourses(handle.db)).toHaveLength(0);
    handle.close();
  });
});

describe("updateCourseAction", () => {
  it("updates an existing course and revalidates its pages", async () => {
    await actions.createCourseAction({}, form("Old Title", ""));
    const id = onlyCourseId();
    vi.clearAllMocks();

    const state = await actions.updateCourseAction(
      id,
      {},
      form("New Title", "Updated"),
    );

    expect(state).toEqual({});
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith(`/courses/${id}`);

    const handle = openDb();
    expect(listCourses(handle.db)[0]).toMatchObject({
      id,
      title: "New Title",
      description: "Updated",
    });
    handle.close();
  });

  it("updates a course learning goal", async () => {
    await actions.createCourseAction({}, form("Old Title", ""));
    const id = onlyCourseId();
    vi.clearAllMocks();

    const state = await actions.updateCourseAction(
      id,
      {},
      form("Old Title", "", "New learning goal"),
    );

    expect(state).toEqual({});
    const handle = openDb();
    expect(listCourses(handle.db)[0].goal).toBe("New learning goal");
    handle.close();
  });

  it("reports an error for an unknown course", async () => {
    const state = await actions.updateCourseAction(
      999999,
      {},
      form("Title", ""),
    );

    expect(state.error).toBeDefined();
  });

  it("reports an error for an invalid course id", async () => {
    const state = await actions.updateCourseAction(
      Number.NaN,
      {},
      form("Title", ""),
    );

    expect(state.error).toBeDefined();
  });
});

describe("deleteCourseAction", () => {
  it("removes a course and redirects home", async () => {
    await actions.createCourseAction({}, form("Doomed", ""));
    const id = onlyCourseId();

    await expectRedirect(actions.deleteCourseAction(id), /^REDIRECT:\/$/);

    const handle = openDb();
    expect(listCourses(handle.db)).toHaveLength(0);
    handle.close();
  });

  it("reports an error for an unknown course", async () => {
    const state = await actions.deleteCourseAction(999999);
    expect(state.error).toBeDefined();
  });
});

describe("exportCourseAction", () => {
  it("produces a serializable course export with modules and lessons", async () => {
    await actions.createCourseAction(
      {},
      form("Real Estate", "Fundamentals", "Invest well"),
    );
    const courseId = onlyCourseId();

    const handle = openDb();
    const rows = handle.db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .get()!;
    const mod = handle.db
      .insert(modules)
      .values({ course_id: rows.id, title: "Basics", position: 1 })
      .returning()
      .get();
    handle.db
      .insert(lessons)
      .values({
        module_id: mod.id,
        position: 1,
        youtube_video_id: "aaaaaaaaaaa",
        youtube_title: "Intro",
        youtube_duration: 600,
      })
      .run();
    handle.close();

    const result = await actions.exportCourseAction(courseId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const payload = JSON.parse(result.json);
    expect(payload.format).toBe("studyforge-course");
    expect(payload.version).toBe(1);
    expect(payload.course).toMatchObject({
      title: "Real Estate",
      description: "Fundamentals",
      goal: "Invest well",
    });
    expect(payload.course.modules).toHaveLength(1);
    expect(payload.course.modules[0]).toMatchObject({
      title: "Basics",
      lessons: [
        { youtubeVideoId: "aaaaaaaaaaa", title: "Intro", durationSeconds: 600 },
      ],
    });
    expect(result.fileName).toMatch(/\.studyforge-course\.json$/);
  });

  it("reports an error for an unknown or invalid course", async () => {
    const unknown = await actions.exportCourseAction(999999);
    expect(unknown.ok).toBe(false);

    const invalid = await actions.exportCourseAction(Number.NaN);
    expect(invalid.ok).toBe(false);
  });
});

describe("importCourseAction", () => {
  function fileInput(content: string, name = "export.studyforge-course.json") {
    const data = new FormData();
    data.set(
      "file",
      new File([content], name, { type: "application/json" }),
    );
    return data;
  }

  function emptyExport(course: Record<string, unknown>) {
    return JSON.stringify({
      format: "studyforge-course",
      version: 1,
      course,
    });
  }

  it("imports a valid export as a new course and redirects", async () => {
    const json = JSON.stringify({
      format: "studyforge-course",
      version: 1,
      course: {
        title: "Imported Course",
        description: "From file",
        goal: "Learn stuff",
        modules: [
          {
            title: "Module A",
            description: "A",
            lessons: [
              { youtubeVideoId: "aaaaaaaaaaa", title: "One", durationSeconds: 300 },
              { youtubeVideoId: "bbbbbbbbbbb" },
            ],
          },
        ],
      },
    });

    await expectRedirect(actions.importCourseAction({}, fileInput(json)), /^REDIRECT:\/courses\/\d+/);

    const handle = openDb();
    const rows = listCourses(handle.db);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      title: "Imported Course",
      description: "From file",
      goal: "Learn stuff",
    });
    const mods = handle.db.select().from(modules).all();
    expect(mods).toHaveLength(1);
    expect(mods[0].title).toBe("Module A");
    const lessonRows = handle.db.select().from(lessons).all();
    expect(lessonRows).toHaveLength(2);
    expect(lessonRows[0]).toMatchObject({
      youtube_video_id: "aaaaaaaaaaa",
      position: 1,
    });
    handle.close();
  });

  it("rejects a missing file", async () => {
    const state = await actions.importCourseAction({}, new FormData());
    expect(state.error).toBeDefined();
  });

  it("rejects non-JSON content", async () => {
    const state = await actions.importCourseAction({}, fileInput("not json"));
    expect(state.error).toBeDefined();
  });

  it("rejects an unknown export format", async () => {
    const state = await actions.importCourseAction(
      {},
      fileInput(
        JSON.stringify({ format: "other", version: 1, course: { title: "X" } }),
      ),
    );
    expect(state.error).toBeDefined();

    const handle = openDb();
    expect(listCourses(handle.db)).toHaveLength(0);
    handle.close();
  });

  it("rejects an oversized file", async () => {
    const content = emptyExport({
      title: "Big",
      description: "x".repeat(6 * 1024 * 1024),
    });
    const state = await actions.importCourseAction({}, fileInput(content));
    expect(state.error).toBeDefined();

    const handle = openDb();
    expect(listCourses(handle.db)).toHaveLength(0);
    handle.close();
  });

  it("rejects an import whose title and ordered module names already exist", async () => {
    const handle = openDb();
    const course = createCourse(handle.db, {
      title: "Worship Piano",
      description: "",
    });
    createModule(handle.db, course.id, {
      title: "Chords",
      description: "",
    });
    createModule(handle.db, course.id, {
      title: "Scales",
      description: "",
    });
    handle.close();

    const json = JSON.stringify({
      format: "studyforge-course",
      version: 1,
      course: {
        title: "  worship piano  ",
        description: "",
        goal: "Play confidently",
        modules: [
          { title: "chords", description: "", lessons: [] },
          { title: "scales", description: "", lessons: [] },
        ],
      },
    });

    const state = await actions.importCourseAction({}, fileInput(json));

    expect(state.error).toBe(`A course named "Worship Piano" with the same modules already exists.`);
    const after = openDb();
    expect(listCourses(after.db)).toHaveLength(1);
    expect(after.db.select().from(modules).all()).toHaveLength(2);
    after.close();
  });

  it("imports when a same-title course has different module names", async () => {
    const handle = openDb();
    const course = createCourse(handle.db, {
      title: "Worship Piano",
      description: "",
    });
    createModule(handle.db, course.id, { title: "Chords", description: "" });
    handle.close();

    const json = JSON.stringify({
      format: "studyforge-course",
      version: 1,
      course: {
        title: "Worship Piano",
        description: "",
        modules: [
          { title: "Different Module", description: "", lessons: [] },
        ],
      },
    });

    await expectRedirect(actions.importCourseAction({}, fileInput(json)), /^REDIRECT:\/courses\/\d+/);

    const after = openDb();
    expect(listCourses(after.db)).toHaveLength(2);
    after.close();
  });

  it("imports when a same-title course has the same modules in a different order", async () => {
    const handle = openDb();
    const course = createCourse(handle.db, {
      title: "Worship Piano",
      description: "",
    });
    createModule(handle.db, course.id, { title: "Chords", description: "" });
    createModule(handle.db, course.id, { title: "Scales", description: "" });
    handle.close();

    const json = JSON.stringify({
      format: "studyforge-course",
      version: 1,
      course: {
        title: "Worship Piano",
        description: "",
        modules: [
          { title: "Scales", description: "", lessons: [] },
          { title: "Chords", description: "", lessons: [] },
        ],
      },
    });

    await expectRedirect(actions.importCourseAction({}, fileInput(json)), /^REDIRECT:\/courses\/\d+/);

    const after = openDb();
    expect(listCourses(after.db)).toHaveLength(2);
    after.close();
  });

  it("imports when a same-title course has a different module count", async () => {
    const handle = openDb();
    const course = createCourse(handle.db, {
      title: "Worship Piano",
      description: "",
    });
    createModule(handle.db, course.id, { title: "Chords", description: "" });
    handle.close();

    const json = JSON.stringify({
      format: "studyforge-course",
      version: 1,
      course: {
        title: "Worship Piano",
        description: "",
        modules: [
          { title: "Chords", description: "", lessons: [] },
          { title: "Scales", description: "", lessons: [] },
        ],
      },
    });

    await expectRedirect(actions.importCourseAction({}, fileInput(json)), /^REDIRECT:\/courses\/\d+/);

    const after = openDb();
    expect(listCourses(after.db)).toHaveLength(2);
    after.close();
  });

  it("imports a same-title empty course into a course with modules", async () => {
    const handle = openDb();
    const course = createCourse(handle.db, {
      title: "Worship Piano",
      description: "",
    });
    createModule(handle.db, course.id, { title: "Chords", description: "" });
    handle.close();

    const json = JSON.stringify({
      format: "studyforge-course",
      version: 1,
      course: { title: "Worship Piano", description: "", modules: [] },
    });

    await expectRedirect(actions.importCourseAction({}, fileInput(json)), /^REDIRECT:\/courses\/\d+/);

    const after = openDb();
    expect(listCourses(after.db)).toHaveLength(2);
    after.close();
  });
});