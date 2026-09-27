# Protocol changes

Explore the package you are changing. This file is what to **keep in sync**, not an API reference.

Published on npm and still before `1.0.0`. Stability policy: [architecture.md](./architecture.md) **Before 1.0**.

## Protocol

Keep these in lockstep (same paths, same payloads — no duplicate route strings):

1. `@dimah-survey/core` — operation map, Zod payloads, `APIError`, `createSurveyFetch`, `createFillClient`, `createEditorClient`
2. `@dimah-survey/server` — `createSurveyEndpoint` routes, `dimahSurvey({ audience }).handler` and `.api`
3. `@dimah-survey/react` — `bindSurveyModel`, `useSurveyResponse`, `bindSurveyCreator`, `useSurveyDraft`, and a re-export of the clients

The browser client takes flat object arguments. `fill.api` and `editor.api` are
the better-call maps (`{ body }` / `{ query }`). Do not wrap `<Survey>`.

Consumer servers import `@dimah-survey/server`. Browsers import `@dimah-survey/react` or `@dimah-survey/core`. Do not pass the server instance into the client.

## Guard

`dimahSurvey({ audience: "fill" })` requires `guard` and mounts `FILL_AUDIENCE_OPERATIONS` only. `guardRespondent(id)` returns `{ respondentId }` for those operations. `guardAnonymous()` returns `{ anonymous: true }`. Returning nothing on a fill request is forbidden. The server stamps a respondent id onto `startResponse` and `listResponses`, rejects a different id in the body or query, rejects `include: "full"`, and rejects `getResponse` / partial / submit / abandon / reopen when the stored `respondentId` differs. Anonymous fill rejects `listResponses` and a body `respondentId`. `getPublishedSurvey` is allowed for both principals and does not stamp a respondent id or require a response id. A row is readable when its `respondentId` is null.

`dimahSurvey({ audience: "editor" })` mounts `EDITOR_AUDIENCE_OPERATIONS` only. Its guard returns nothing or throws. A returned principal is forbidden. Do not add a second auth system. Submit and start hooks, plus a custom `validateResult` and `sanitizePartial`, belong on the fill instance. Publish hooks belong on the editor instance.

## Store

`database` implements `SurveyStore`. `memoryAdapter()` is the reference. A SQL adapter must:

- keep `draftJson`, `publishedJson`, and `settings` in separate columns. `settings` is not null and has no database default. `saveSurvey` inserts `DEFAULT_SURVEY_SETTINGS` and does not update that column. `definition` does not receive `settings`
- copy `publishedJson` into `response.definition` at start and never update that column on later publishes
- reject stale `expectedUpdatedAt` in the write
- refuse start unless status is `active` and `publishedJson` is present
- identified `startResponse` looks up the open draft and the latest row inside the write. There is no separate store method for that lookup. `settings.responses: "one-open"` returns that draft instead of inserting. `"single"` returns the latest row of any status for that pair. Anonymous `startResponse` always inserts. `settings` does not change that
- `startResponse` calls optional lifecycle callbacks inside the same lock: `onStart` only before a new insert, `afterStart` only after it. The HTTP body does not carry them
- `submitResponse` optional lifecycle runs inside the same lock as the write. `prepare` runs only for a draft, after the window, cap, and `expectedUpdatedAt` checks, and returns the data to persist. `alreadySubmitted` runs when the row is already submitted and must not call hooks. `afterSubmit` runs after the row is stored; a throw leaves the row. The HTTP body does not carry them
- outside `opensAt`/`closesAt`, start, partial save, and submit throw `SURVEY_CLOSED`. Abandon, get, and reopen stay available. `maxResponses` counts `submitted` rows and rejects a new insert and a submit with `RESPONSE_LIMIT`. The check runs inside the process lock. There is no extra SQL index for the cap
- `reopen: false` makes `reopenResponse` throw `RESPONSE_CLOSED`. Otherwise it rejects with `OPEN_DRAFT` when another draft exists for that survey and respondent
- `resumeSurvey` sets `archived` plus `publishedJson` back to `active` and does not copy `draftJson`. An active survey is returned unchanged. No published document is `NOT_PUBLISHED`
- the partial unique index `dimah_response_one_open_draft` is in `src/schema/examples/indexes.sql` (`status = 'draft'` and `respondent_id` is not null). Enforce the same rule in the write
- `listSurveys` / `listResponses` honor `limit` and `offset` and sort by `updatedAt` descending. `countResponses` ignores `limit`, `offset`, and `include`. Summary rows omit `definition` and `data`

`@dimah-survey/db` schema copies stay in lockstep: `src/schema/v1.ts`,
`src/schema/examples/tables.sql`, `src/schema/examples/drizzle.ts`, and
`src/schema/examples/schema.prisma`. Those copies are package exports
(`@dimah-survey/db/schema/drizzle.ts`, `schema/tables.sql`,
`schema/indexes.sql`, `schema/schema.prisma`) so a consumer agent can read the
current shape. The app still owns the tables it migrates. Generate that file
with FumaDB's CLI, or paste the reference into the app. Do not import the
reference into the running schema. SQL tables are `dimah_survey` and
`dimah_response`. Schema keys and Drizzle export names stay `survey` and
`response`; `db()` queries those ORM names. `db()` must not update
`response.definition` after insert. Do not add a survey version table. FumaDB
does not emit the secondary indexes; those live in
`src/schema/examples/indexes.sql` and in the app schema.

Partial save replaces `data`. Fill `sanitizePartial` defaults to `"clear"`: `clearIncorrectValues(true)` without `validate`, then that object is stored. `"replace"` stores the payload as sent. Questions with `choicesByUrl` keep their posted value through the clear. Submit persists the object `validateResult` already accepted. Abandon and reopen do not change `definition` or `data`.

## Validation

`validateResult` stays required. When `survey-core` is added, the built-in checker lives in `server` and still receives the response definition, not the live survey. `clearIncorrectValues` output is what gets stored. Do not reimplement SurveyJS validators.

Validation failure is `VALIDATION_FAILED`. The body includes `questions`, the names that failed. Do not localize `message`. Callers branch on `code`.

## React

The fill hook reads the snapshot, constructs a Model, and calls partial save / submit with `expectedUpdatedAt` from the last read. It does not render questions. Do not add `survey-react-ui` or `survey-creator-core` to this package. `partial: "page"` is the default and enables page-next partial send. `partial: "off"` leaves complete as the only write. A write failure sets `saveError` and leaves the Model mounted. `STALE_UPDATE` sets `stale`. `reload` hydrates the stored snapshot again. File bytes are not a route: the app handles `onUploadFiles` on that Model, with `storeDataAsText: false`, and `data` keeps the returned URL.

`bindSurveyCreator` turns Creator autosave into `saveSurvey`. It does not call publish. The app still constructs Creator.

## Publish boundary

`@dimah-survey/core`, `server`, `react`, and `db` are public npm packages. The tsup + `tsc --emitDeclarationOnly` + `tsc-alias` pipeline stays, and public exports point at `dist`. Version and changelog rules live in [release.md](./release.md).
