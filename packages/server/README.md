# @dimah-survey/server

`dimahSurvey()` is the server-authoritative lifecycle for SurveyJS JSON: a Fetch `handler`, an in-process `api`, and submit validation against the response snapshot.

SurveyJS owns the survey schema and the renderer. This package owns publish, the per-response `definition`, drafts, and submit.

## Install

```bash
pnpm add @dimah-survey/server
```

`database` is required; SQL is not. `memoryAdapter()` is for tests and process-local development. Use `@dimah-survey/db` or a custom `SurveyStore` for durable data.

```ts
import { dimahSurvey, memoryAdapter } from "@dimah-survey/server";

export const survey = dimahSurvey({
  database: memoryAdapter(),
  guard: async ({ request, operation }) => {
    /* auth */
  },
});
```

Mount `survey.handler` on a Fetch runtime. Submit validation defaults to survey-core `clearIncorrectValues(true)` then `validate`, against the stored definition.

## License

MIT
