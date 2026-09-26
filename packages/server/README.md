# @dimah-survey/server

`dimahSurvey()` is the server-authoritative lifecycle for SurveyJS JSON: a Fetch `handler`, an in-process `api`, and submit validation against the response snapshot.

SurveyJS owns the survey schema and the renderer. This package owns publish, the per-response `definition`, drafts, and submit.

## Install

```bash
pnpm add @dimah-survey/server
```

`database` is required; SQL is not. `memoryAdapter()` is for tests and process-local development. Use `@dimah-survey/db` or a custom `SurveyStore` for durable data.

```ts
import {
  APIError,
  SURVEY_ERROR_CODES,
  dimahSurvey,
  guardRespondent,
  memoryAdapter,
} from "@dimah-survey/server";

export const survey = dimahSurvey({
  database: memoryAdapter(),
  guard: ({ request, operation }) => {
    const userId = userIdFromSession(request);
    if (!userId) {
      throw APIError.from("FORBIDDEN", SURVEY_ERROR_CODES.FORBIDDEN);
    }
    if (isEditor(request)) return;
    return guardRespondent(userId)({ request, operation });
  },
});
```

A fill request returns `{ respondentId }`. The server stamps that id onto start and list, and refuses another respondent's row, `include: "full"`, and `getSurvey` (that read includes `draftJson`). An editor request returns nothing, so the body may still name a respondent. Omit `respondentId` from the fill client, or send the same id.

Mount `survey.handler` on a Fetch runtime. Submit validation defaults to survey-core `clearIncorrectValues(true)` then `validate`, against the stored definition.

## License

MIT
