import { drizzle } from "drizzle-orm/node-sqlite";
import { drizzleAdapter } from "fumadb/adapters/drizzle";

import { DimahSurveyDB, db } from "../index";
import { relations } from "../schema/examples/drizzle";
import { sqliteSchemaSql } from "./sqlite-schema";

export function openSqliteStore() {
  const sqlite = drizzle(":memory:", { relations });
  sqlite.$client.exec("pragma foreign_keys = on;");
  sqlite.$client.exec(sqliteSchemaSql);
  return db(
    DimahSurveyDB.client(drizzleAdapter({ db: sqlite, provider: "sqlite" })),
  );
}
