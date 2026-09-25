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
  "survey",
  {
    id: text("id", { length: 255 }).primaryKey().notNull(),
    slug: text("slug", { length: 255 }).notNull(),
    status: text("status").notNull(),
    draftJson: blob("draft_json", { mode: "json" }).notNull(),
    publishedJson: blob("published_json", { mode: "json" }),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("survey_slug_unique").on(table.slug),
    check(
      "survey_status_check",
      sql`${table.status} in ('draft', 'active', 'archived')`,
    ),
    index("survey_status_updated_at_idx").on(table.status, table.updatedAt),
  ],
);

export const response = sqliteTable(
  "response",
  {
    id: text("id", { length: 255 }).primaryKey().notNull(),
    surveyId: text("survey_id", { length: 255 }).notNull(),
    respondentId: text("respondent_id", { length: 255 }),
    status: text("status").notNull(),
    definition: blob("definition", { mode: "json" }).notNull(),
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
      name: "response_survey_fk",
    })
      .onUpdate("restrict")
      .onDelete("restrict"),
    check(
      "response_status_check",
      sql`${table.status} in ('draft', 'submitted', 'abandoned')`,
    ),
    index("response_survey_id_updated_at_idx").on(
      table.surveyId,
      table.updatedAt,
    ),
    index("response_respondent_lookup_idx").on(
      table.surveyId,
      table.respondentId,
      table.status,
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
  { survey, response, privateDimahSurveySettings },
  (helpers) => ({
    survey: {
      responses: helpers.many.response({
        from: helpers.survey.id,
        to: helpers.response.surveyId,
      }),
    },
    response: {
      survey: helpers.one.survey({
        from: helpers.response.surveyId,
        to: helpers.survey.id,
      }),
    },
  }),
);
