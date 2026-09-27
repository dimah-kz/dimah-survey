# dimah-survey

Server-authoritative response lifecycle for [SurveyJS](https://surveyjs.io/) JSON.

## Status

Pre-release. The API documented in this repository is the current design;
`@dimah-survey/*` packages are not on npm yet. Run the reference app locally to
evaluate the complete flow.

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

## Try the reference app

[`examples/next`](./examples/next) demonstrates Creator, fill, durable SQLite
storage, anonymous and identified flows, and snapshot-based response reads.

```bash
pnpm install
pnpm example
```

The example mounts fill at `/api/survey` and editor at `/api/admin/survey`.
Its editor is intentionally open for exploration; production applications must
protect it with an editor guard.

## Documentation

The Fumadocs site lives in [`apps/docs`](./apps/docs). Start it from the
repository root:

```bash
pnpm dev:docs
```

Then open <http://localhost:3001>. Its [content](./apps/docs/content/docs)
covers the example, minimal integration, server setup, collection lifecycle,
React bindings, persistence, and protocol reference.

## Development

Node 24+ and pnpm 12+ are required.

```bash
pnpm check-types
pnpm test
```

Release workflow details live in [`docs/agents/release.md`](./docs/agents/release.md).

## License

[MIT](./LICENSE)
