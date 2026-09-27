# @dimah-survey/db

SQL `SurveyStore` and schema references for the dimah-survey lifecycle.

`draft_json` and `published_json` are separate columns. Every response stores a
copy of the published document in `definition`.

## Install

```bash
npm i @dimah-survey/db fumadb
```

Do not import this package from `@dimah-survey/server`. Create `db(client)` in
your application and pass it to both server audiences.

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

## Own your schema and migrations

Your application owns the tables, migrations, indexes, and extensions. SQL names
are `dimah_survey` and `dimah_response`; the Drizzle export names remain
`survey` and `response` because those are the models `db()` queries.

Generate or copy the reference schema into the application, then migrate that
application-owned file. Keep
`dimah_response_one_open_draft`: one draft per identified respondent and
survey depends on that partial unique index.

## Reference files

These exports are source references, not runtime models:

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

`dimah-survey generate 1.0.0 -o ./db/survey.ts` writes the ORM schema into the
app. FumaDB does not emit secondary indexes. Prisma cannot express the partial
open-draft rule, so apply `@dimah-survey/db/schema/indexes.sql` after Prisma
creates its tables.

## Documentation

<https://survey.dimah.dev/docs/persistence> covers `db()`, schema ownership, and
custom stores. The [package map](https://survey.dimah.dev/docs/packages) shows
where this package sits next to `server`.

## License

MIT
