import { defineRelations, sql } from "drizzle-orm";
import {
  blob,
  check,
  foreignKey,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const survey = sqliteTable(
  "dimah_survey",
  {
    id: text("id", { length: 255 }).primaryKey().notNull(),
    slug: text("slug", { length: 255 }).notNull(),
    status: text("status").notNull(),
    draftJson: blob("draft_json", { mode: "json" }).notNull(),
    publishedVersionId: text("published_version_id", { length: 255 }),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    settings: blob("settings", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("dimah_survey_slug_unique").on(table.slug),
    check(
      "dimah_survey_status_check",
      sql`${table.status} in ('draft', 'active', 'archived')`,
    ),
    index("dimah_survey_status_updated_at_idx").on(
      table.status,
      table.updatedAt,
    ),
  ],
);

export const surveyVersion = sqliteTable(
  "dimah_survey_version",
  {
    id: text("id", { length: 255 }).primaryKey().notNull(),
    surveyId: text("survey_id", { length: 255 }).notNull(),
    definition: blob("definition", { mode: "json" }).notNull(),
    contentHash: text("content_hash", { length: 64 }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.surveyId],
      foreignColumns: [survey.id],
      name: "dimah_survey_version_survey_fk",
    })
      .onUpdate("restrict")
      .onDelete("restrict"),
    uniqueIndex("dimah_survey_version_survey_hash").on(
      table.surveyId,
      table.contentHash,
    ),
    index("dimah_survey_version_survey_id_created_at_idx").on(
      table.surveyId,
      table.createdAt,
    ),
  ],
);

export const response = sqliteTable(
  "dimah_response",
  {
    id: text("id", { length: 255 }).primaryKey().notNull(),
    surveyId: text("survey_id", { length: 255 }).notNull(),
    respondentId: text("respondent_id", { length: 255 }),
    status: text("status").notNull(),
    versionId: text("version_id", { length: 255 }).notNull(),
    data: blob("data", { mode: "json" }).notNull(),
    submittedAt: integer("submitted_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.surveyId],
      foreignColumns: [survey.id],
      name: "dimah_response_survey_fk",
    })
      .onUpdate("restrict")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.versionId],
      foreignColumns: [surveyVersion.id],
      name: "dimah_response_version_fk",
    })
      .onUpdate("restrict")
      .onDelete("restrict"),
    check(
      "dimah_response_status_check",
      sql`${table.status} in ('draft', 'submitted', 'abandoned')`,
    ),
    index("dimah_response_survey_id_updated_at_idx").on(
      table.surveyId,
      table.updatedAt,
    ),
    index("dimah_response_respondent_lookup_idx").on(
      table.surveyId,
      table.respondentId,
      table.status,
    ),
    uniqueIndex("dimah_response_one_open_draft")
      .on(table.surveyId, table.respondentId)
      .where(
        sql`${table.status} = 'draft' and ${table.respondentId} is not null`,
      ),
  ],
);

export const privateDimahSurveySettings = sqliteTable(
  "private_dimah_survey_settings",
  {
    id: text("id", { length: 255 }).primaryKey().notNull(),
    version: text("version", { length: 255 }).notNull().default("1.0.0"),
  },
);

export const relations = defineRelations(
  { survey, surveyVersion, response, privateDimahSurveySettings },
  (helpers) => ({
    survey: {
      versions: helpers.many.surveyVersion({
        from: helpers.survey.id,
        to: helpers.surveyVersion.surveyId,
      }),
      responses: helpers.many.response({
        from: helpers.survey.id,
        to: helpers.response.surveyId,
      }),
    },
    surveyVersion: {
      survey: helpers.one.survey({
        from: helpers.surveyVersion.surveyId,
        to: helpers.survey.id,
      }),
      responses: helpers.many.response({
        from: helpers.surveyVersion.id,
        to: helpers.response.versionId,
      }),
    },
    response: {
      survey: helpers.one.survey({
        from: helpers.response.surveyId,
        to: helpers.survey.id,
      }),
      version: helpers.one.surveyVersion({
        from: helpers.response.versionId,
        to: helpers.surveyVersion.id,
      }),
    },
  }),
);
