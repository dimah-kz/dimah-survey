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

The app owns the tables. Generate them into the app with FumaDB's CLI, then extend that file. Drizzle and Prisma pick the file up like any other app schema.

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

`dimah-survey generate 1.0.0 -o ./db/survey.ts` writes the ORM schema. FumaDB does not emit secondary indexes. Keep `response_one_open_draft` in the app schema after you generate; one open draft per survey and identified respondent depends on it. Prisma cannot express that predicate, so apply [`indexes.sql`](./src/schema/examples/indexes.sql) after the Prisma tables exist. Reference copies live in [`src/schema/examples`](./src/schema/examples).

## License

MIT
