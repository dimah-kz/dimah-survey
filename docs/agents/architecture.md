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
| `core`   | Routes, Zod payloads, errors, `createSurveyClient`, store types       |
| `server` | `dimahSurvey()`, HTTP handler, `memoryAdapter()`, `survey-core` check |
| `react`  | Fill session that hydrates a Model. No renderer.                      |
| `db`     | FumaDB schema, SQL copies, and `db(client)` as `SurveyStore`.         |

Shared protocol changes start in `core`, then wire `server` and the fetch client. Do not copy a route string into another package.

## Product shape

- Two survey documents: editor `draftJson`, and `publishedJson` cloned onto each new response as `definition`.
- Response status is `draft` | `submitted` | `abandoned`. Reopen returns to draft and does not rewrite `definition`.
- `validateResult` runs inside submit on the stored definition. The default is `checkSurveyResult`: `clearIncorrectValues(true)`, then `validate`, then persist `survey.data`. Adapters do not interpret SurveyJS JSON.
- `survey-core` is a server dependency and a React peer. `core` stays free of it. `bindSurveyModel` / `useSurveyResponse` attach save and submit to a Model. They do not render `<Survey>`.
- File upload, dashboards, PDF, and Creator are out of this repo. SurveyJS Analytics and PDF read the snapshot plus `data`; do not flatten results against the live survey.
- Optional `expectedUpdatedAt` is compare-and-swap against `updatedAt`. SQL adapters must enforce it in the write, not only in memory.
- HTTP is a better-call router. The browser client is better-fetch. `survey.api` takes `{ body }` or `{ query }`; the fetch client takes flat objects.
- Pre-v1: breaking changes are allowed. Do not keep a compatibility shim.

## Do not

- Import `@dimah-form/*` or map SurveyJS elements onto dimah-form field types.
- Put question widgets, Creator, or `<Survey>` in any package.
- Hand-roll a router or a second fetch client beside better-call and better-fetch.
- Store a response as `surveyId` + result JSON without `definition`.
- Let Creator autosave call publish.
- Inject persistence through a plugin slot. There is no plugin system until a second feature needs one.
- Add a survey version table. The response snapshot is the history.
