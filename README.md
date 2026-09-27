# dimah-survey

The backend lifecycle layer for [SurveyJS](https://surveyjs.io/) JSON.

## What it owns

SurveyJS owns the schema, renderer, and Creator. Your application owns auth,
database migrations, and UI composition. dimah-survey owns:

- an editable `draftJson` and an explicit `publishedJson`
- a frozen `response.definition` for every started response
- partial save, submit, reopen, and response collection policy
- submit validation against the stored definition
- separate fill and editor HTTP audiences over one shared store

A later publish never rewrites an existing response. This is not a form
renderer, hosted survey product, SurveyJS plugin, or dimah-form integration.

## Packages

| Package                | Role                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `@dimah-survey/core`   | Protocol, browser clients, schemas, errors, and store types |
| `@dimah-survey/server` | Server factory, guards, validation, handlers, and adapters  |
| `@dimah-survey/react`  | SurveyJS Model and Creator bindings; no renderer            |
| `@dimah-survey/db`     | SQL `SurveyStore` and schema references for your app        |

## Install

```bash
npm i @dimah-survey/server @dimah-survey/react survey-core survey-react-ui
```

Install `@dimah-survey/db` when you want the SQL store, or `@dimah-survey/core`
for a non-React client and shared protocol types.

## Documentation

The Fumadocs site lives in [`apps/docs`](./apps/docs). Start it from the
repository root:

```bash
pnpm dev:docs
```

Then open <http://localhost:3001>. Its [content](./apps/docs/content/docs)
covers backend integration, collection lifecycle, React bindings, persistence,
and the protocol reference.

## Development

Node 24+ and pnpm 12+ are required.

```bash
pnpm check-types
pnpm test
```

Release workflow details live in [`docs/agents/release.md`](./docs/agents/release.md).

## License

[MIT](./LICENSE)
