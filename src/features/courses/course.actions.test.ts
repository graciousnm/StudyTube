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
import { closeDb, createDb, getDb, type Db } from "@/db/client";
import { courses } from "@/db/schema";
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