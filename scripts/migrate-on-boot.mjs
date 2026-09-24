import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const databaseUrl = process.env.DATABASE_URL ?? "./data/learning.sqlite";

if (databaseUrl !== ":memory:" && !databaseUrl.startsWith("file:")) {
  mkdirSync(path.dirname(path.resolve(databaseUrl)), { recursive: true });
}

const sqlite = new Database(databaseUrl);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const migrationsFolder = path.resolve(scriptDir, "..", "src", "db", "migrations");

migrate(drizzle(sqlite), { migrationsFolder });

sqlite.close();

console.log(`Migrations applied. Database: ${databaseUrl}`);