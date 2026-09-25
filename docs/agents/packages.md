# Protocol changes

Explore the package you are changing. This file is what to **keep in sync**, not an API reference.

Until the first `1.0.0` **and until [architecture.md](./architecture.md) Pre-v1 is edited**, breaking changes are allowed.

## Protocol

Keep these in lockstep (same paths, same payloads — no duplicate route strings):

1. `@dimah-survey/core` — operation map, Zod payloads, `APIError`, `createSurveyFetch`, `createSurveyClient`
2. `@dimah-survey/server` — `createSurveyEndpoint` routes, `dimahSurvey().handler` and `.api`
3. `@dimah-survey/react` — re-exports the client until the fill session exists

The browser client takes flat object arguments. `survey.api` is the better-call map (`{ body }` / `{ query }`). Do not wrap `<Survey>`.

Consumer servers import `@dimah-survey/server`. Browsers import `@dimah-survey/react` or `@dimah-survey/core`. Do not pass the server instance into the client.

## Store

`database` implements `SurveyStore`. `memoryAdapter()` is the reference. A SQL adapter must:

- keep `draftJson` and `publishedJson` in separate columns
- copy `publishedJson` into `response.definition` at start and never update that column on later publishes
- reject stale `expectedUpdatedAt` in the write
- refuse start unless status is `active` and `publishedJson` is present

Partial save replaces `data`. Submit persists the object `validateResult` already accepted. Abandon and reopen do not change `definition` or `data`.

## Validation

`validateResult` stays required. When `survey-core` is added, the built-in checker lives in `server` and still receives the response definition, not the live survey. `clearIncorrectValues` output is what gets stored. Do not reimplement SurveyJS validators.

Validation failure is `VALIDATION_FAILED`. Do not localize `message`. Callers branch on `code`.

## React

The fill hook reads the snapshot, constructs a Model, and calls partial save / submit. It does not render questions. Do not add `survey-react-ui` to this package.

## Publish boundary

Remove `"private": true` only after the built-in `survey-core` submit check exists and the snapshot test covers it. The tsup + `tsc --emitDeclarationOnly` + `tsc-alias` pipeline stays, and public exports point at `dist`.
