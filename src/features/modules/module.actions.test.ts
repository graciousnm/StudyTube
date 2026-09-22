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
import { courses } from "@/db/schema";
import { createCourse } from "@/features/courses/course.mutations";
import { createModule } from "./module.mutations";
import { getModuleInCourse, listModulesByCourse } from "./module.queries";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

let dir: string;
let databaseUrl: string;
let courseId: number;
let actions: typeof import("./module.actions");
let revalidatePath: ReturnType<typeof vi.fn>;

function form(title: string, description = ""): FormData {
  const data = new FormData();
  data.set("title", title);
  data.set("description", description);
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

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "studyforge-module-actions-"));
  databaseUrl = path.join(dir, "test.sqlite");
  const setup = createDb(databaseUrl);
  migrate(setup.db, { migrationsFolder });
  setup.close();

  process.env.DATABASE_URL = databaseUrl;
  closeDb();
  actions = await import("./module.actions");
  revalidatePath = (await import("next/cache")).revalidatePath as unknown as ReturnType<
    typeof vi.fn
  >;
});

beforeEach(() => {
  getDb().delete(courses).run();
  vi.clearAllMocks();
  courseId = createCourse(getDb(), { title: "Course", description: "" }).id;
});

afterAll(() => {
  closeDb();
  rmSync(dir, { recursive: true, force: true });
});

describe("createModuleAction", () => {
  it("creates a module in the course and revalidates the course page", async () => {
    const state = await actions.createModuleAction(
      courseId,
      {},
      form("Alpha", "Desc"),
    );

    expect(state).toEqual({});
    expect(revalidatePath).toHaveBeenCalledWith(`/courses/${courseId}`);

    const modules = listModulesByCourse(getDb(), courseId);
    expect(modules).toHaveLength(1);
    expect(modules[0]).toMatchObject({
      course_id: courseId,
      title: "Alpha",
      description: "Desc",
      position: 1,
    });
  });

  it("returns field errors and creates nothing for invalid input", async () => {
    const state = await actions.createModuleAction(courseId, {}, form("   "));

    expect(state.fieldErrors?.title).toBeDefined();
    expect(listModulesByCourse(getDb(), courseId)).toHaveLength(0);
  });

  it("reports an unknown course", async () => {
    const state = await actions.createModuleAction(999999, {}, form("Alpha"));
    expect(state.error).toBeDefined();
    expect(listModulesByCourse(getDb(), courseId)).toHaveLength(0);
  });
});

describe("updateModuleAction", () => {
  it("updates the module and revalidates its pages", async () => {
    const mod = createModule(getDb(), courseId, {
      title: "Old",
      description: "",
    });
    vi.clearAllMocks();

    const state = await actions.updateModuleAction(
      mod.id,
      {},
      form("New", "Updated"),
    );

    expect(state).toEqual({});
    expect(revalidatePath).toHaveBeenCalledWith(`/courses/${courseId}`);
    expect(revalidatePath).toHaveBeenCalledWith(
      `/courses/${courseId}/modules/${mod.id}`,
    );

    const modules = listModulesByCourse(getDb(), courseId);
    expect(modules[0]).toMatchObject({ id: mod.id, title: "New" });
  });

  it("reports an unknown module", async () => {
    const state = await actions.updateModuleAction(999999, {}, form("New"));
    expect(state.error).toBeDefined();
  });
});

describe("deleteModuleAction", () => {
  it("deletes a module owned by the course and redirects to the course", async () => {
    const mod = createModule(getDb(), courseId, {
      title: "Doomed",
      description: "",
    });

    await expectRedirect(
      actions.deleteModuleAction(courseId, mod.id),
      new RegExp(`^REDIRECT:/courses/${courseId}$`),
    );

    expect(listModulesByCourse(getDb(), courseId)).toHaveLength(0);
  });

  it("refuses to delete a module that belongs to another course", async () => {
    const otherCourseId = createCourse(getDb(), {
      title: "Other",
      description: "",
    }).id;
    const otherModule = createModule(getDb(), otherCourseId, {
      title: "Other module",
      description: "",
    });

    const state = await actions.deleteModuleAction(courseId, otherModule.id);

    expect(state.error).toBeDefined();
    expect(getModuleInCourse(getDb(), otherCourseId, otherModule.id)).toBeDefined();
  });
});

describe("moveModuleAction", () => {
  it("reorders modules without redirecting", async () => {
    createModule(getDb(), courseId, { title: "A", description: "" });
    const b = createModule(getDb(), courseId, { title: "B", description: "" });
    createModule(getDb(), courseId, { title: "C", description: "" });

    await expect(actions.moveModuleAction(courseId, b.id, "up")).resolves.toBeUndefined();

    expect(
      listModulesByCourse(getDb(), courseId).map((mod) => mod.title),
    ).toEqual(["B", "A", "C"]);
  });

  it("ignores a module that belongs to another course", async () => {
    const otherCourseId = createCourse(getDb(), {
      title: "Other",
      description: "",
    }).id;
    createModule(getDb(), courseId, { title: "A", description: "" });
    const otherModule = createModule(getDb(), otherCourseId, {
      title: "Other",
      description: "",
    });

    await actions.moveModuleAction(courseId, otherModule.id, "up");

    expect(listModulesByCourse(getDb(), otherCourseId)).toHaveLength(1);
    expect(listModulesByCourse(getDb(), courseId)).toHaveLength(1);
  });
});
