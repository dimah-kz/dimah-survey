# @dimah-survey/db

SQL shape for the survey lifecycle. `draft_json` and `published_json` are separate columns. Each response stores a copy of the published document in `definition`.

`db(client)` implements `SurveyStore`. `client` is `DimahSurveyDB.client(adapter)`. Do not import this package from `@dimah-survey/server`.

The FumaDB schema is `v1`. Copy-paste Drizzle, Prisma, and SQL live in `src/schema/examples` and are not imported at runtime. FumaDB does not emit the secondary indexes; apply `indexes.sql` after the tables exist.
