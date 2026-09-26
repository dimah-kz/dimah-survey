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

Copy or generate the schema for your ORM, then retain the published secondary indexes:

[`drizzle.ts`](./src/schema/examples/drizzle.ts) ·
[`schema.prisma`](./src/schema/examples/schema.prisma) ·
[`tables.sql`](./src/schema/examples/tables.sql) ·
[`indexes.sql`](./src/schema/examples/indexes.sql)

The FumaDB schema is `v1`. Those copies are not imported at runtime. FumaDB does not emit the secondary indexes; apply `indexes.sql` after the tables exist.

## License

MIT
