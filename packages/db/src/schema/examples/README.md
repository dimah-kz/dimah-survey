# Schema examples

`src/schema/v1.ts` is the FumaDB source. These files are exported as references (`@dimah-survey/db/schema/drizzle.ts` and the SQL and Prisma files beside it). Read or paste them into the app. Do not import them at runtime. Generate the app schema with FumaDB's CLI, then keep the indexes FumaDB does not emit.

| File                               | Dialect                      |
| ---------------------------------- | ---------------------------- |
| [`tables.sql`](./tables.sql)       | PostgreSQL tables and checks |
| [`indexes.sql`](./indexes.sql)     | Secondary indexes, any SQL   |
| [`drizzle.ts`](./drizzle.ts)       | Drizzle SQLite               |
| [`schema.prisma`](./schema.prisma) | Prisma PostgreSQL            |

SQL tables are `dimah_survey`, `dimah_survey_version`, and `dimah_response`. Drizzle exports stay `survey`, `surveyVersion`, and `response`. `definition` on a version is insert-only. `version_id` on a response is insert-only. `settings` is the collection policy and is not copied onto a version. The column is not null and has no database default; the store writes `DEFAULT_SURVEY_SETTINGS` on create. `published_version_id` has no foreign key, because a version also points at the survey. `dimah_response_one_open_draft` is the partial unique index: one `draft` row per survey and respondent. Anonymous rows are excluded. Prisma cannot express that predicate; it lives in `indexes.sql` and `drizzle.ts`. An existing database groups each stored response document by canonical hash into `dimah_survey_version`, points `version_id` and `published_version_id` at those rows, and then drops `definition` and `published_json`.
