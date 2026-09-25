# dimah-survey

Server-authoritative response lifecycle for [SurveyJS](https://surveyjs.io/) JSON.

SurveyJS owns the survey schema, the renderer, and Creator. This library owns the part SurveyJS leaves to your server: an editor draft, a published document, a definition snapshot on every response, drafts, and submit validation against that snapshot.

It is not a form renderer, not a hosted survey product, and not a plugin for dimah-form.

## Status

The lifecycle is usable. Submit validation defaults to `survey-core` (`clearIncorrectValues(true)` then `validate`) against the response snapshot. `@dimah-survey/react` binds that same `Model` for partial save and complete. It does not render the survey. `@dimah-survey/db` is the SQL schema and `db(client)` store.

## Packages

| Package                | Role                                              |
| ---------------------- | ------------------------------------------------- |
| `@dimah-survey/core`   | Routes, payloads, errors, fetch client            |
| `@dimah-survey/server` | `dimahSurvey()`, Fetch handler, `memoryAdapter()` |
| `@dimah-survey/react`  | Client re-export. Fill hook is not implemented    |

## Workspace

```bash
pnpm install
pnpm check-types
pnpm test
```

Node 22 or newer.

## License

[MIT](./LICENSE)
