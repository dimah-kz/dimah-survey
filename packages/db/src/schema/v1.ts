import { column, idColumn, schema, table } from "fumadb/schema";

/**
 * Each publish inserts an immutable `dimah_survey_version`, or reuses one
 * when the canonical document already exists. A response stores `version_id`.
 * `published_version_id` points at the version new responses start from.
 * There is no foreign key on that pointer: the version row also points back
 * at the survey.
 *
 * SQL names are `dimah_survey`, `dimah_survey_version`, and `dimah_response`.
 * The schema keys are the ORM names `db()` queries.
 * FumaDB does not emit secondary indexes. Those live in `./examples/`.
 */
const survey = table("dimah_survey", {
  id: idColumn("id", "varchar(255)"),
  slug: column("slug", "varchar(255)").unique(),
  status: column("status", "string"),
  draftJson: column("draft_json", "json"),
  publishedVersionId: column("published_version_id", "varchar(255)").nullable(),
  publishedAt: column("published_at", "timestamp").nullable(),
  /** Collection rules. Not copied onto a published version. */
  settings: column("settings", "json"),
  createdAt: column("created_at", "timestamp").defaultTo$("now"),
  updatedAt: column("updated_at", "timestamp").defaultTo$("now"),
});

const surveyVersion = table("dimah_survey_version", {
  id: idColumn("id", "varchar(255)"),
  surveyId: column("survey_id", "varchar(255)"),
  /** Insert-only SurveyJS document. */
  definition: column("definition", "json"),
  contentHash: column("content_hash", "varchar(64)"),
  createdAt: column("created_at", "timestamp").defaultTo$("now"),
}).unique("dimah_survey_version_survey_hash", ["surveyId", "contentHash"]);

const response = table("dimah_response", {
  id: idColumn("id", "varchar(255)"),
  surveyId: column("survey_id", "varchar(255)"),
  respondentId: column("respondent_id", "varchar(255)").nullable(),
  status: column("status", "string"),
  /** Insert-only pointer at the version this response started on. */
  versionId: column("version_id", "varchar(255)"),
  data: column("data", "json"),
  submittedAt: column("submitted_at", "timestamp").nullable(),
  createdAt: column("created_at", "timestamp").defaultTo$("now"),
  updatedAt: column("updated_at", "timestamp").defaultTo$("now"),
});

export const v1 = schema({
  version: "1.0.0",
  tables: {
    survey,
    surveyVersion,
    response,
  },
  relations: {
    survey: ({ many }) => ({
      versions: many("surveyVersion"),
      responses: many("response"),
    }),
    surveyVersion: ({ one, many }) => ({
      survey: one("survey", ["surveyId", "id"]).foreignKey(),
      responses: many("response"),
    }),
    response: ({ one }) => ({
      survey: one("survey", ["surveyId", "id"]).foreignKey(),
      version: one("surveyVersion", ["versionId", "id"]).foreignKey(),
    }),
  },
});
