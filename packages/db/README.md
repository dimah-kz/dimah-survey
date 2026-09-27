# @dimah-survey/db

SQL shape and `db(client)` store for the dimah-survey lifecycle. `draft_json` and `published_json` are separate columns. Each response stores a copy of the published document in `definition`.

Do not import this package from `@dimah-survey/server`. Pass `db(client)` as the `database` option.

## Install

```bash
pnpm add @dimah-survey/db fumadb
```

```ts
import { DimahSurveyDB, db } from "@dimah-survey/db";
import { dimahSurvey } from "@dimah-survey/server";
import { drizzleAdapter } from "fumadb/adapters/drizzle";

const database = db(
  DimahSurveyDB.client(drizzleAdapter({ db: drizzleOrm, provider: "sqlite" })),
);

const editor = dimahSurvey({
  audience: "editor",
  database,
});
```

The app owns the tables. Write them in the app schema and migrate that file. SQL names are `dimah_survey` and `dimah_response`. Drizzle export names stay `survey` and `response`, because those are the ORM names `db()` looks up. Generate a fresh copy with FumaDB's CLI when the library schema changes, then keep any indexes or extra columns you added.

These package paths are references for you and for agents. Read them. Do not import them into the running app:

- `@dimah-survey/db/schema/drizzle.ts`
- `@dimah-survey/db/schema/tables.sql`
- `@dimah-survey/db/schema/indexes.sql`
- `@dimah-survey/db/schema/schema.prisma`

```ts
import { createCli } from "fumadb/cli";
import { DimahSurveyDB } from "@dimah-survey/db";
import { drizzleAdapter } from "fumadb/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-sqlite";

await createCli({
  db: DimahSurveyDB.client(
    drizzleAdapter({ db: drizzle(":memory:"), provider: "sqlite" }),
  ),
  command: "dimah-survey",
  version: "0.0.0",
}).main();
```

`dimah-survey generate 1.0.0 -o ./db/survey.ts` writes the ORM schema into the app. FumaDB does not emit secondary indexes. Keep `dimah_response_one_open_draft` in the app schema after you generate; one open draft per survey and identified respondent depends on it. Prisma cannot express that predicate, so apply `@dimah-survey/db/schema/indexes.sql` after the Prisma tables exist.

## License

MIT
