# @dimah-survey/server

Server factory, guards, SurveyJS validation, and runtime adapters for
[dimah-survey](https://survey.dimah.dev).

`dimahSurvey()` creates an isolated fill or editor audience with both a Fetch
handler and a typed in-process API.

## Install

```bash
npm i @dimah-survey/server survey-core
```

Published on npm, still before `1.0.0`. A release may change the API.

## Create the backend

Create two instances over one store. Fill always requires a principal; editor
authorization allows the request or throws.

```ts
import { dimahSurvey, guardRespondent } from "@dimah-survey/server";

import { database } from "./db";

export const editor = dimahSurvey({
  audience: "editor",
  database,
  guard: ({ request }) => assertEditor(request),
});

export const fill = dimahSurvey({
  audience: "fill",
  database,
  guard: (context) => {
    const userId = requireUserId(context.request);
    return guardRespondent(userId)(context);
  },
});
```

Create `database` with `@dimah-survey/db`. Drizzle, Prisma, and Kysely are in
the [quickstart](https://survey.dimah.dev/docs/quickstart).

## Mount a runtime adapter

For Next.js App Router:

```ts
import { toNextJsHandler } from "@dimah-survey/server/next";
import { fill } from "@/lib/survey";

export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(fill);
```

Mount editor separately at `/api/admin/survey`. Adapters are also available
for Node.js, Express, Hono, Fastify, Elysia, and SvelteKit.

## Guarantees

- fill cannot publish or read editor drafts
- editor cannot start or mutate respondent responses
- the guard establishes response ownership on the server
- submit validation runs on the stored `response.definition`
- a matching repeated submit is idempotent

## Documentation

- [Mount the server](https://survey.dimah.dev/docs/integration)
- [Authorization and identity](https://survey.dimah.dev/docs/security)
- [Database](https://survey.dimah.dev/docs/database)

## License

MIT
