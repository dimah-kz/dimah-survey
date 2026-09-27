# Schema examples

`src/schema/v1.ts` is the FumaDB source. These files are exported as references (`@dimah-survey/db/schema/drizzle.ts` and the SQL and Prisma files beside it). Read or paste them into the app. Do not import them at runtime. Generate the app schema with FumaDB's CLI, then keep the indexes FumaDB does not emit.

| File                               | Dialect                      |
| ---------------------------------- | ---------------------------- |
| [`tables.sql`](./tables.sql)       | PostgreSQL tables and checks |
| [`indexes.sql`](./indexes.sql)     | Secondary indexes, any SQL   |
| [`drizzle.ts`](./drizzle.ts)       | Drizzle SQLite               |
| [`schema.prisma`](./schema.prisma) | Prisma PostgreSQL            |

`response.definition` is insert-only. `survey.settings` is the collection policy and is not copied into that column. The column is not null and has no database default; the store writes `DEFAULT_SURVEY_SETTINGS` on create. Do not add a survey version table. `response_one_open_draft` is the partial unique index: one `draft` row per survey and respondent. Anonymous rows are excluded. Prisma cannot express that predicate; it lives in `indexes.sql` and `drizzle.ts`.
