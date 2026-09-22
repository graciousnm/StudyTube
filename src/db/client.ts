import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

const DEFAULT_DATABASE_URL = "./data/learning.sqlite";

function ensureDirectory(databaseUrl: string): void {
  if (databaseUrl === ":memory:" || databaseUrl.startsWith("file:")) {
    return;
  }
  mkdirSync(path.dirname(path.resolve(databaseUrl)), { recursive: true });
}

export interface DatabaseHandle {
  db: Db;
  close: () => void;
}

export function createDb(databaseUrl: string): DatabaseHandle {
  ensureDirectory(databaseUrl);
  const sqlite = new Database(databaseUrl);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  return { db, close: () => sqlite.close() };
}

const globalForDb = globalThis as unknown as {
  __studyforgeDb?: DatabaseHandle;
};

export function getDb(): Db {
  if (!globalForDb.__studyforgeDb) {
    globalForDb.__studyforgeDb = createDb(
      process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    );
  }
  return globalForDb.__studyforgeDb.db;
}

export function closeDb(): void {
  globalForDb.__studyforgeDb?.close();
  globalForDb.__studyforgeDb = undefined;
}