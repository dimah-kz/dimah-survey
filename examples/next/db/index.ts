import "server-only";

import fs from "node:fs";
import path from "node:path";

import { drizzle } from "drizzle-orm/node-sqlite";
import { migrate } from "drizzle-orm/node-sqlite/migrator";

import { relations } from "@/db/schema";
import { rehashSurveyVersions } from "@/db/rehash";

async function open() {
  const file = path.join(process.cwd(), "data", "survey.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = drizzle(file, { relations });
  sqlite.$client.exec(`
    pragma journal_mode = wal;
    pragma busy_timeout = 5000;
    pragma foreign_keys = off;
  `);
  try {
    // Drizzle applies every migration inside one transaction, so a
    // PRAGMA foreign_keys inside the SQL never takes effect. A migration
    // may rebuild dimah_survey while dimah_response still references it.
    migrate(sqlite, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
  } finally {
    sqlite.$client.exec(`pragma foreign_keys = on;`);
  }
  await rehashSurveyVersions(sqlite);
  return sqlite;
}

const globalForDb = globalThis as typeof globalThis & {
  sqlite?: Awaited<ReturnType<typeof open>>;
};

export const sqlite = (globalForDb.sqlite ??= await open());
