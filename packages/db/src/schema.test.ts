import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { sqliteSchemaSql } from "./test/sqlite-schema";

const here = dirname(fileURLToPath(import.meta.url));
const examples = join(here, "schema/examples");

const v1 = readFileSync(join(here, "schema/v1.ts"), "utf8");
const tables = readFileSync(join(examples, "tables.sql"), "utf8");
const indexes = readFileSync(join(examples, "indexes.sql"), "utf8");
const drizzle = readFileSync(join(examples, "drizzle.ts"), "utf8");
const prisma = readFileSync(join(examples, "schema.prisma"), "utf8");

const copies = [v1, tables, drizzle, prisma, sqliteSchemaSql];

describe("schema copies", () => {
  it("names the same tables and columns", () => {
    for (const source of copies) {
      expect(source).toContain("dimah_survey");
      expect(source).toContain("dimah_response");
      for (const column of [
        "draft_json",
        "published_json",
        "published_at",
        "settings",
        "survey_id",
        "respondent_id",
        "definition",
        "submitted_at",
      ]) {
        expect(source).toContain(column);
      }
    }
  });

  it("keeps the status checks and the open-draft index", () => {
    for (const source of [tables, drizzle, sqliteSchemaSql]) {
      expect(source).toContain("'draft', 'active', 'archived'");
      expect(source).toContain("'draft', 'submitted', 'abandoned'");
    }
    for (const source of [indexes, drizzle, prisma, sqliteSchemaSql]) {
      expect(source).toContain("dimah_survey_status_updated_at_idx");
      expect(source).toContain("dimah_response_survey_id_updated_at_idx");
      expect(source).toContain("dimah_response_respondent_lookup_idx");
      expect(source).toContain("dimah_response_one_open_draft");
    }
    expect(indexes).toContain("status = 'draft' and respondent_id is not null");
    expect(sqliteSchemaSql).toContain(
      "status = 'draft' and respondent_id is not null",
    );
  });

  it("stays on schema version 1.0.0", () => {
    expect(v1).toContain('version: "1.0.0"');
    expect(drizzle).toContain('default("1.0.0")');
    expect(prisma).toContain('@default("1.0.0")');
    expect(sqliteSchemaSql).toContain("default '1.0.0'");
  });
});
