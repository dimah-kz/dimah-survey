# Architecture

Server-authoritative response lifecycle for SurveyJS JSON. Consumers own auth, Survey Creator, and the SurveyJS renderer. This library owns publish, snapshots, and submit.

## Package chain

```
@dimah-survey/core
        ↓
@dimah-survey/server | @dimah-survey/react
        ↑
@dimah-survey/db
```

`@dimah-survey/db` owns the SQL shape and `db(client)`. `server` must not import it.

## Placement

Edit the **smallest package that owns the behavior**.

| Package  | Owns                                                                  |
| -------- | --------------------------------------------------------------------- |
| `core`   | Routes, Zod payloads, errors, fill and editor clients, store types    |
| `server` | `dimahSurvey()`, HTTP handler, `memoryAdapter()`, `survey-core` check |
| `react`  | Fill session that hydrates a Model. No renderer.                      |
| `db`     | FumaDB schema, SQL copies, and `db(client)` as `SurveyStore`.         |

Shared protocol changes start in `core`, then wire `server` and the fetch client. Do not copy a route string into another package.

## Product shape

- Two survey documents: editor `draftJson`, and `publishedJson` cloned onto each new response as `definition`. `settings` is a third column: collection rules (`responses`, `reopen`, `opensAt`, `closesAt`, `maxResponses`). It is not SurveyJS JSON, it is not copied onto `definition`, and it has no database default. `saveSurvey` does not change it. `saveSurveySettings` replaces the object. `resumeSurvey` turns an archived survey with `publishedJson` back to `active` and does not copy `draftJson`.
- Fill can read `GET /survey/published` (`publishedJson` and `settings` only) before start. Outside the window that read still returns the document. Start, partial save, and submit throw `SURVEY_CLOSED`. `maxResponses` counts `submitted` rows and is checked before a new insert and before submit. `responses: "single"` returns the latest row for that respondent. Anonymous starts still insert. `reopen: false` makes `reopenResponse` throw `RESPONSE_CLOSED`.
- Response status is `draft` | `submitted` | `abandoned`. Reopen returns to draft and does not rewrite `definition`.
- `validateResult` runs inside submit on the stored definition. The default is `checkSurveyResult`: `clearIncorrectValues(true)`, then `validate`, then persist `survey.data`. Adapters do not interpret SurveyJS JSON.
- `survey-core` is a server dependency and a React peer. `core` stays free of it. `bindSurveyModel` / `useSurveyResponse` attach save and submit to a Model. They do not render `<Survey>`. `partial: "page"` (the default) turns on `partialSendEnabled` and `sendResultOnPageNext`. `partial: "off"` submits only on complete. A partial save or submit failure leaves that Model mounted. `saveError` is the failure. `stale` means `STALE_UPDATE`. `reload` reads the stored snapshot again. `error` is only a failed load. `bindSurveyCreator` / `useSurveyDraft` set Creator `isAutoSave` and `saveSurveyFunc` so autosave calls `saveSurvey` (`draftJson` only). They do not construct Creator. Publish stays a separate call.
- File bytes stay in the app. A File or Signature question sets `storeDataAsText` to false. The app handles `onUploadFiles`, `onDownloadFile`, and `onClearFiles` on the Model. `data` stores the locator those handlers return (`{ file, content }` where `content` is the URL). Dashboards, PDF, and the Creator UI are out of this repo. SurveyJS Analytics and PDF read the snapshot plus `data`; do not flatten results against the live survey.
- `listSurveys` and `listResponses` are paginated. Response lists default to a summary that omits `definition` and `data`. `include: "full"` is the analytics read of the snapshot.
- Identified `startResponse` follows `settings.responses`. `"one-open"` returns the open draft. `"single"` returns the latest row of any status. A new row is inserted only when that lookup misses. Anonymous starts always insert. `reopenResponse` fails with `OPEN_DRAFT` when another draft for that pair is already open, and with `RESPONSE_CLOSED` when `settings.reopen` is false.
- A repeated submit of a row that is already `submitted` returns that row when the cleaned payload equals stored `data`, and does not run hooks again. A different payload is `RESPONSE_CLOSED`.
- Fill hooks: `onSubmit` after validation and before persist, `afterSubmit` after the row is stored. `onStart` runs inside the store lock only before a new insert. `afterStart` runs after that insert and does not roll the row back. Editor hooks: `onPublish` before `draftJson` is copied, `afterPublish` after. `resumeSurvey` does not call them. There is no plugin system.
- `audience: "fill"` mounts response routes plus `getPublishedSurvey` and requires `guard`. The guard returns `{ respondentId }` (`guardRespondent`) or `{ anonymous: true }` (`guardAnonymous`). Returning nothing is forbidden. The server stamps a respondent id onto start and list, refuses `include: "full"`, and refuses another respondent's row. Anonymous fill refuses list and a claimed `respondentId`; the response id is the capability. `getPublishedSurvey` does not stamp a respondent. `audience: "editor"` mounts survey routes, including `saveSurveySettings` and `resumeSurvey`, plus `getResponse` and `listResponses` (including `include: "full"`). It does not mount start, partial, submit, abandon, or reopen. An editor guard returns nothing, or throws. Returning a respondent is forbidden. Defaults are `/api/survey` and `/api/admin/survey`.
- Framework adapters (`next`, `node`, `express`, `hono`, `fastify`, `elysia`, `svelte-kit`) only forward `handler`. They do not interpret SurveyJS JSON.
- Optional `expectedUpdatedAt` is compare-and-swap against `updatedAt`. SQL adapters must enforce it in the write, not only in memory. The React fill hook sends the token it last read.
- HTTP is a better-call router. The browser client is better-fetch. `survey.api` takes `{ body }` or `{ query }`; the fetch client takes flat objects.

## Pre-release

`@dimah-survey/*` is still under construction and has not been published. The tree is the current design, not a version anyone depends on. API stability is not a goal yet.

Land the shape you would actually ship. Remove the previous route, payload, type, column, or export in the same change. A compatibility alias, a deprecated export, or a second path is out of scope. SemVer does not decide whether a break is allowed.

This section is the whole policy. After the first npm release, replace it: breaks stay allowed until `1.0.0`, leftover compatibility code is still removed, and a break is recorded as `major`.

## Do not

- Import `@dimah-form/*` or map SurveyJS elements onto dimah-form field types.
- Put question widgets, Creator, or `<Survey>` in any package.
- Hand-roll a router or a second fetch client beside better-call and better-fetch.
- Store a response as `surveyId` + result JSON without `definition`.
- Let Creator autosave call publish.
- Inject persistence through a plugin slot. There is no plugin system until a second feature needs one.
- Add a survey version table. The response snapshot is the history.
