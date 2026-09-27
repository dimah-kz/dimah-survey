# @dimah-survey/db

SQL `SurveyStore` and schema references for
[dimah-survey](https://survey.dimah.dev).

Your application owns its database client, tables, migrations, and indexes.
This package supplies the FumaDB schema and store behavior.

## Install

```bash
npm i @dimah-survey/db fumadb
```

Published on npm, still before `1.0.0`. A release may change the API.

## Create the store

```ts
import { DimahSurveyDB, db } from "@dimah-survey/db";

const database = db(DimahSurveyDB.client(adapter));
```

`adapter` is `drizzleAdapter`, `prismaAdapter`, or `kyselyAdapter` from
`fumadb/adapters`. Pass the same `database` to both audiences. The
[Database](https://survey.dimah.dev/docs/persistence) page has each ORM.

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

`createCli` takes `DimahSurveyDB.client(adapter)`. That client only emits a
file. Drizzle, Prisma, and Kysely scripts are on
[Persistence](https://survey.dimah.dev/docs/persistence).

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
