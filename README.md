# dimah-survey

Server-authoritative response lifecycle for [SurveyJS](https://surveyjs.io/) JSON.

SurveyJS owns the survey schema, the renderer, and Creator. This library owns the part SurveyJS leaves to your server: an editor draft, a published document, a definition snapshot on every response, drafts, and submit validation against that snapshot.

It is not a form renderer, not a hosted survey product, and not a plugin for dimah-form.

## Status

The lifecycle is usable. Submit validation defaults to `survey-core` (`clearIncorrectValues(true)` then `validate`) against the response snapshot. Mount `audience: "fill"` and `audience: "editor"` as separate handlers. An identified respondent has one open draft. `@dimah-survey/react` binds a `Model` for partial save and complete, and binds Creator autosave to the editor draft. It does not render the survey or Creator. `@dimah-survey/db` is the SQL schema and `db(client)` store.

## Packages

| Package                | Role                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `@dimah-survey/core`   | Routes, payloads, errors, fill and editor clients             |
| `@dimah-survey/server` | `dimahSurvey({ audience })`, Fetch handler, `memoryAdapter()` |
| `@dimah-survey/react`  | Binds a Model and Creator autosave. Does not render           |
| `@dimah-survey/db`     | SQL schema and `db(client)` store                             |

## Workspace

```bash
pnpm install
pnpm check-types
pnpm test
```

Node 24 or newer. Versions are cut with Tegami; see [docs/agents/release.md](./docs/agents/release.md).

## License

[MIT](./LICENSE)
