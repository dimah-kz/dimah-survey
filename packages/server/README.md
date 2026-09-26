# @dimah-survey/server

`dimahSurvey()` is the server-authoritative lifecycle for SurveyJS JSON: a Fetch `handler`, an in-process `api`, and submit validation against the response snapshot.

SurveyJS owns the survey schema and the renderer. This package owns publish, the per-response `definition`, drafts, and submit.

## Install

```bash
pnpm add @dimah-survey/server
```

`database` is required; SQL is not. `memoryAdapter()` is for tests and process-local development. Use `@dimah-survey/db` or a custom `SurveyStore` for durable data.

Mount fill and editor separately. Fill cannot serve `draftJson` or publish. Editor cannot serve start, partial save, or submit. `hooks` and a custom `validateResult` go on the fill instance, because that handler owns submit.

```ts
import {
  APIError,
  SURVEY_API_BASE_PATH,
  SURVEY_EDITOR_API_BASE_PATH,
  SURVEY_ERROR_CODES,
  createEditorClient,
  createFillClient,
  dimahSurvey,
  guardAnonymous,
  guardRespondent,
  memoryAdapter,
} from "@dimah-survey/server";

const database = memoryAdapter();

export const editor = dimahSurvey({
  audience: "editor",
  database,
  basePath: SURVEY_EDITOR_API_BASE_PATH,
  guard: ({ request }) => {
    if (!isEditor(request)) {
      throw APIError.from("FORBIDDEN", SURVEY_ERROR_CODES.FORBIDDEN);
    }
  },
});

export const fill = dimahSurvey({
  audience: "fill",
  database,
  basePath: SURVEY_API_BASE_PATH,
  guard: (context) => {
    const userId = userIdFromSession(context.request);
    if (!userId) return guardAnonymous()(context);
    return guardRespondent(userId)(context);
  },
});

export const editorClient = createEditorClient({
  baseURL: SURVEY_EDITOR_API_BASE_PATH,
});
export const fillClient = createFillClient({
  baseURL: SURVEY_API_BASE_PATH,
});
```

A logged-in fill guard returns `{ respondentId }`. The server stamps that id onto start and list, keeps one open draft for that survey and respondent, and refuses another respondent's row and `include: "full"`. `guardAnonymous()` is the public link: each start inserts a row, list is refused, and the response id is the capability. An editor guard returns nothing. Omit `respondentId` from the fill client, or send the same id.

`settings` on the survey is the collection policy: `responses` (`"one-open"` or `"single"`), `reopen`, `opensAt`, `closesAt`, and `maxResponses`. It is not SurveyJS JSON and it is not copied onto `response.definition`. Change it with `saveSurveySettings`. `GET /survey/published` on the fill handler returns `publishedJson` and `settings` only. `resumeSurvey` opens an archived survey again without copying `draftJson`.

Fill `sanitizePartial` defaults to `"clear"` (`clearIncorrectValues(true)`, no `validate`). `"replace"` stores the partial payload as sent. `hooks` on fill are `onStart`, `afterStart`, `onSubmit`, and `afterSubmit`. `hooks` on the editor are `onPublish` and `afterPublish`.

Mount each `handler` on a Fetch runtime. Submit validation defaults to survey-core `clearIncorrectValues(true)` then `validate`, against the stored definition. A repeated submit of the same answers returns the stored row.

## License

MIT
