# @dimah-survey/db

SQL `SurveyStore` and schema references for
[dimah-survey](https://survey.dimah.dev).

Your application owns its database client, tables, migrations, and indexes.
This package supplies the FumaDB schema and store behavior.

## Install

```bash
npm i @dimah-survey/db fumadb
```

## Create the store

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

Pass the same `database` to both the fill and editor instances.

## Own the schema

SQL table names are `dimah_survey` and `dimah_response`. Drizzle model keys
remain `survey` and `response`, because those are the keys `db()` queries.

Generate or copy the schema into your application and migrate that file. Keep
the `dimah_response_one_open_draft` partial unique index as a backstop for one
draft per survey and identified respondent.

Readable reference exports:

- `@dimah-survey/db/schema/drizzle.ts`
- `@dimah-survey/db/schema/tables.sql`
- `@dimah-survey/db/schema/indexes.sql`
- `@dimah-survey/db/schema/schema.prisma`

They are source references, not runtime ORM models.

## Generate with FumaDB

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
  version: "YOUR_APP_VERSION",
}).main();
```

```bash
dimah-survey generate 1.0.0 -o ./db/survey.ts
```

FumaDB does not emit secondary indexes. Prisma also cannot express the partial
open-draft predicate, so apply the exported `indexes.sql` separately.

## Storage guarantees

- `draft_json`, `published_json`, and `settings` remain separate
- `definition` is an insert-only copy of the published document
- compare-and-swap and collection policy checks happen inside writes
- summary lists omit response definition and data

## Documentation

- [Persistence](https://survey.dimah.dev/docs/persistence)
- [Package map](https://survey.dimah.dev/docs/packages)

## License

MIT
