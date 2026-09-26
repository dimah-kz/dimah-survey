# Schema examples

Not imported at runtime. `src/schema/v1.ts` is the FumaDB source. These files are the same columns for the ORMs that do not read that source.

| File                               | Dialect                      |
| ---------------------------------- | ---------------------------- |
| [`tables.sql`](./tables.sql)       | PostgreSQL tables and checks |
| [`indexes.sql`](./indexes.sql)     | Secondary indexes, any SQL   |
| [`drizzle.ts`](./drizzle.ts)       | Drizzle SQLite               |
| [`schema.prisma`](./schema.prisma) | Prisma PostgreSQL            |

`response.definition` is insert-only. Do not add a survey version table. `response_one_open_draft` is the partial unique index: one `draft` row per survey and respondent. Anonymous rows are excluded. Prisma cannot express that predicate; it lives in `indexes.sql` and `drizzle.ts`.
