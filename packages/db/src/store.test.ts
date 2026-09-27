import { SURVEY_ERROR_CODES } from "@dimah-survey/core";
import { drizzle } from "drizzle-orm/node-sqlite";
import { drizzleAdapter } from "fumadb/adapters/drizzle";
import { describe, expect, it } from "vitest";

import { relations } from "./schema/examples/drizzle";
import { DimahSurveyDB, db } from "./index";

const schemaSql = `
create table dimah_survey (
  id text primary key not null,
  slug text not null,
  status text not null,
  draft_json blob not null,
  published_json blob,
  published_at integer,
  settings blob not null,
  created_at integer not null,
  updated_at integer not null,
  constraint dimah_survey_status_check check (status in ('draft', 'active', 'archived'))
);
create unique index dimah_survey_slug_unique on dimah_survey (slug);
create index dimah_survey_status_updated_at_idx on dimah_survey (status, updated_at);
create table dimah_response (
  id text primary key not null,
  survey_id text not null,
  respondent_id text,
  status text not null,
  definition blob not null,
  data blob not null,
  submitted_at integer,
  created_at integer not null,
  updated_at integer not null,
  constraint dimah_response_survey_fk foreign key (survey_id) references dimah_survey (id),
  constraint dimah_response_status_check check (status in ('draft', 'submitted', 'abandoned'))
);
create index dimah_response_survey_id_updated_at_idx on dimah_response (survey_id, updated_at);
create index dimah_response_respondent_lookup_idx on dimah_response (survey_id, respondent_id, status);
create unique index dimah_response_one_open_draft on dimah_response (survey_id, respondent_id)
  where status = 'draft' and respondent_id is not null;
create table private_dimah_survey_settings (
  id text primary key not null,
  version text not null default '1.0.0'
);
`;

function openStore() {
  const sqlite = drizzle(":memory:", { relations });
  sqlite.$client.exec("pragma foreign_keys = on;");
  sqlite.$client.exec(schemaSql);
  return db(
    DimahSurveyDB.client(drizzleAdapter({ db: sqlite, provider: "sqlite" })),
  );
}

const draft = { title: "v1", pages: [] as unknown[] };

describe("db store", () => {
  it("accepts the returned updatedAt on the next write", async () => {
    const store = openStore();
    const created = await store.saveSurvey({
      id: "pulse",
      slug: "pulse",
      draftJson: draft,
    });
    const saved = await store.saveSurvey({
      id: "pulse",
      draftJson: { title: "v2", pages: [] },
      expectedUpdatedAt: created.updatedAt,
    });
    expect(saved.draftJson).toEqual({ title: "v2", pages: [] });
    expect((await store.getSurvey("pulse"))?.updatedAt).toBe(saved.updatedAt);

    await store.publishSurvey({
      id: "pulse",
      expectedUpdatedAt: saved.updatedAt,
    });
    const started = await store.startResponse({ surveyId: "pulse" });
    const partial = await store.savePartial({
      id: started.id,
      data: { q1: "yes" },
      expectedUpdatedAt: started.updatedAt,
    });
    expect(partial.data).toEqual({ q1: "yes" });
    expect((await store.getResponse(started.id))?.updatedAt).toBe(
      partial.updatedAt,
    );
  });

  it("maps a slug conflict to SLUG_TAKEN", async () => {
    const store = openStore();
    const settled = await Promise.allSettled([
      store.saveSurvey({ id: "a", slug: "pulse", draftJson: draft }),
      store.saveSurvey({ id: "b", slug: "pulse", draftJson: draft }),
    ]);
    const rejected = settled.filter((item) => item.status === "rejected");
    expect(settled.filter((item) => item.status === "fulfilled")).toHaveLength(
      1,
    );
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toMatchObject({
      code: SURVEY_ERROR_CODES.SLUG_TAKEN.code,
    });
  });

  it("keeps the response definition after a later publish", async () => {
    const store = openStore();
    const created = await store.saveSurvey({
      id: "pulse",
      slug: "pulse",
      draftJson: draft,
    });
    const published = await store.publishSurvey({
      id: "pulse",
      expectedUpdatedAt: created.updatedAt,
    });
    const started = await store.startResponse({ surveyId: "pulse" });
    const edited = await store.saveSurvey({
      id: "pulse",
      draftJson: { title: "v2", pages: [] },
      expectedUpdatedAt: published.updatedAt,
    });
    await store.publishSurvey({
      id: "pulse",
      expectedUpdatedAt: edited.updatedAt,
    });
    expect((await store.getResponse(started.id))?.definition).toEqual(draft);
  });

  it("returns the open draft for a second identified start", async () => {
    const store = openStore();
    const created = await store.saveSurvey({
      id: "pulse",
      slug: "pulse",
      draftJson: draft,
    });
    await store.publishSurvey({
      id: "pulse",
      expectedUpdatedAt: created.updatedAt,
    });
    const first = await store.startResponse({
      surveyId: "pulse",
      respondentId: "user-1",
    });
    const second = await store.startResponse({
      surveyId: "pulse",
      respondentId: "user-1",
    });
    expect(second.id).toBe(first.id);
    expect(second.status).toBe("draft");
  });
});
