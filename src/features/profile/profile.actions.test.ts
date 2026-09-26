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
import { profile } from "@/db/schema";
import { getProfile } from "./profile.queries";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

let dir: string;
let actions: typeof import("./profile.actions");
let revalidatePath: ReturnType<typeof vi.fn>;

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

function formName(value: string): FormData {
  const data = new FormData();
  data.set("name", value);
  return data;
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "studytube-profile-actions-"));
  const databaseUrl = path.join(dir, "test.sqlite");
  const setup = createDb(databaseUrl);
  migrate(setup.db, { migrationsFolder });
  setup.close();

  process.env.DATABASE_URL = databaseUrl;
  closeDb();
  delete (globalThis as { __studytubeDb?: unknown }).__studytubeDb;
  actions = await import("./profile.actions");
  revalidatePath = (await import("next/cache")).revalidatePath as unknown as ReturnType<
    typeof vi.fn
  >;
});

beforeEach(() => {
  getDb().delete(profile).run();
  vi.clearAllMocks();
});

afterAll(() => {
  closeDb();
  rmSync(dir, { recursive: true, force: true });
});

describe("completeOnboardingAction", () => {
  it("creates the profile and redirects home", async () => {
    await expectRedirect(actions.completeOnboardingAction({}, formName("  Learner  ")), /^REDIRECT:\/$/);

    expect(getProfile(getDb())).toMatchObject({ id: 1, name: "Learner" });
  });

  it("returns field errors and persists nothing for an empty name", async () => {
    const state = await actions.completeOnboardingAction({}, formName("  "));

    expect(state.error).toBeDefined();
    expect(state.fieldErrors?.name).toBeDefined();
    expect(getProfile(getDb())).toBeUndefined();
  });
});

describe("updateProfileNameAction", () => {
  it("renames the profile and revalidates the affected pages", async () => {
    await expectRedirect(actions.completeOnboardingAction({}, formName("Learner")), /^REDIRECT:\/$/);
    vi.clearAllMocks();

    const state = await actions.updateProfileNameAction({}, formName("Renamed"));

    expect(state).toEqual({ ok: true });
    expect(getProfile(getDb())?.name).toBe("Renamed");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/profile");
    expect(revalidatePath).toHaveBeenCalledWith("/onboarding");
  });

  it("reports an error when no profile exists", async () => {
    const state = await actions.updateProfileNameAction({}, formName("Renamed"));

    expect(state.error).toBeDefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("reports field errors for an invalid name", async () => {
    await expectRedirect(actions.completeOnboardingAction({}, formName("Learner")), /^REDIRECT:\/$/);
    vi.clearAllMocks();

    const state = await actions.updateProfileNameAction({}, formName("   "));

    expect(state.fieldErrors?.name).toBeDefined();
    expect(getProfile(getDb())?.name).toBe("Learner");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});