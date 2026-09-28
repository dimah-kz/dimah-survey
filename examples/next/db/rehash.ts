import "server-only";

import { surveyContentHash } from "@dimah-survey/core";
import type { drizzle } from "drizzle-orm/node-sqlite";

type Sqlite = ReturnType<typeof drizzle>;

type VersionRow = {
  id: string;
  surveyId: string;
  definition: unknown;
  contentHash: string;
};

function asJson(value: unknown): Record<string, unknown> {
  if (typeof value === "string")
    return JSON.parse(value) as Record<string, unknown>;
  if (value instanceof Uint8Array) {
    return JSON.parse(new TextDecoder().decode(value)) as Record<
      string,
      unknown
    >;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

/** Replace migration placeholder hashes with the canonical document hash. */
export async function rehashSurveyVersions(sqlite: Sqlite) {
  const rows = sqlite.$client
    .prepare(
      `select id, survey_id as surveyId, definition, content_hash as contentHash
       from dimah_survey_version`,
    )
    .all() as VersionRow[];
  const groups = new Map<string, { hash: string; rows: VersionRow[] }>();
  for (const row of rows) {
    const hash = await surveyContentHash(asJson(row.definition));
    const key = `${row.surveyId}\0${hash}`;
    const group = groups.get(key) ?? { hash, rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  }
  const updateHash = sqlite.$client.prepare(
    `update dimah_survey_version set content_hash = ? where id = ?`,
  );
  const repointResponse = sqlite.$client.prepare(
    `update dimah_response set version_id = ? where version_id = ?`,
  );
  const repointSurvey = sqlite.$client.prepare(
    `update dimah_survey set published_version_id = ? where published_version_id = ?`,
  );
  const remove = sqlite.$client.prepare(
    `delete from dimah_survey_version where id = ?`,
  );
  for (const group of groups.values()) {
    const [keep, ...rest] = group.rows;
    if (!keep) continue;
    for (const extra of rest) {
      repointResponse.run(keep.id, extra.id);
      repointSurvey.run(keep.id, extra.id);
      remove.run(extra.id);
    }
    if (keep.contentHash !== group.hash) updateHash.run(group.hash, keep.id);
  }
  sqlite.$client.exec(`
    create unique index if not exists dimah_survey_version_survey_hash
    on dimah_survey_version (survey_id, content_hash);
  `);
}
