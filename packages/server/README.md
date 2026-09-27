# @dimah-survey/server

Server factory, guards, validation, framework adapters, and the in-memory
reference store for dimah-survey.

`dimahSurvey()` creates a Fetch `handler` for one audience and an in-process
`api` for server code. Submit validation runs on the response definition that
was frozen at start.

## Install

```bash
npm i @dimah-survey/server survey-core
```

## Create two audiences

Both instances share one `database`. Fill is for respondents and always
requires a guard. Editor is for draft/publish operations and its guard returns
nothing or throws.

```ts
import {
  APIError,
  SURVEY_ERROR_CODES,
  dimahSurvey,
  guardAnonymous,
  guardRespondent,
  memoryAdapter,
} from "@dimah-survey/server";

const database = memoryAdapter();

export const editor = dimahSurvey({
  audience: "editor",
  database,
  guard: ({ request }) => {
    if (!isEditor(request)) {
      throw APIError.from("FORBIDDEN", SURVEY_ERROR_CODES.FORBIDDEN);
    }
  },
});

export const fill = dimahSurvey({
  audience: "fill",
  database,
  guard: (context) => {
    const userId = userIdFromSession(context.request);
    return userId
      ? guardRespondent(userId)(context)
      : guardAnonymous()(context);
  },
});
```

`memoryAdapter()` is process-local. Use `db(client)` from
`@dimah-survey/db`, or a custom `SurveyStore`, for durable storage.

## Mount a handler

For Next.js, mount the fill and editor handlers on separate routes:

```ts
import { toNextJsHandler } from "@dimah-survey/server/next";
import { fill } from "@/lib/survey";

export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(fill);
```

The default base paths are `/api/survey` for fill and `/api/admin/survey` for
editor. Adapters are also available for Node, Express, Hono, Fastify, Elysia,
and SvelteKit.

## Guarantees

- Fill cannot publish or read editor drafts.
- Editor cannot start, partially save, or submit responses.
- Identified respondents are stamped by the server; callers cannot claim a
  different identity.
- `validateResult` defaults to SurveyJS validation on `response.definition`.
- A repeated submit with the same cleaned data is idempotent.

## Documentation

<https://survey.dimah.dev/docs/integration> covers handlers and the in-process
API. Also see [security](https://survey.dimah.dev/docs/security) and
[persistence](https://survey.dimah.dev/docs/persistence).

## License

MIT
