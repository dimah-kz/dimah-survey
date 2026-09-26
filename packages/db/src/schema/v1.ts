import { column, idColumn, schema, table } from "fumadb/schema";

/**
 * Editor draft and the published document are different columns.
 * A response copies `published_json` into `definition` at start.
 * There is no survey version table.
 *
 * FumaDB does not emit secondary indexes. Those live in `./examples/`.
 */
const survey = table("survey", {
  id: idColumn("id", "varchar(255)"),
  slug: column("slug", "varchar(255)").unique(),
  status: column("status", "string"),
  draftJson: column("draft_json", "json"),
  publishedJson: column("published_json", "json").nullable(),
  publishedAt: column("published_at", "timestamp").nullable(),
  /** Collection rules. Not copied into response.definition. */
  settings: column("settings", "json"),
  createdAt: column("created_at", "timestamp").defaultTo$("now"),
  updatedAt: column("updated_at", "timestamp").defaultTo$("now"),
});

const response = table("response", {
  id: idColumn("id", "varchar(255)"),
  surveyId: column("survey_id", "varchar(255)"),
  respondentId: column("respondent_id", "varchar(255)").nullable(),
  status: column("status", "string"),
  /** Insert-only copy of `survey.published_json`. Later publishes must not write this column. */
  definition: column("definition", "json"),
  data: column("data", "json"),
  submittedAt: column("submitted_at", "timestamp").nullable(),
  createdAt: column("created_at", "timestamp").defaultTo$("now"),
  updatedAt: column("updated_at", "timestamp").defaultTo$("now"),
});

export const v1 = schema({
  version: "1.0.0",
  tables: {
    survey,
    response,
  },
  relations: {
    survey: ({ many }) => ({
      responses: many("response"),
    }),
    response: ({ one }) => ({
      survey: one("survey", ["surveyId", "id"]).foreignKey(),
    }),
  },
});
