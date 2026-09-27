# dimah-survey

[![CI](https://github.com/dimah-kz/dimah-survey/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dimah-kz/dimah-survey/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-survey.dimah.dev-0e8a16)](https://survey.dimah.dev)
[![License: MIT](https://img.shields.io/github/license/dimah-kz/dimah-survey)](./LICENSE)

Server-owned publishing and response lifecycles for
[SurveyJS](https://surveyjs.io/) JSON.

Publish an editable survey, freeze the definition each response starts with,
save drafts, and validate submissions against that same snapshot.

[Documentation](https://survey.dimah.dev) · [Contributing](./CONTRIBUTING.md) · [Support](./SUPPORT.md) · [Security](./SECURITY.md) · [Code of conduct](./CODE_OF_CONDUCT.md)

```bash
npm i @dimah-survey/server @dimah-survey/react survey-core survey-react-ui
```

## Why it exists

SurveyJS owns the schema, Creator, question behavior, and renderer. Your
application owns authentication, database migrations, files, and UI.
dimah-survey owns the server lifecycle between them:

- separate editable and published SurveyJS documents
- immutable per-response definitions
- partial save, submit, abandon, and reopen
- collection windows, response limits, and compare-and-swap writes
- submit validation against the stored response definition
- isolated fill and editor APIs over one shared store

> A later publish never rewrites an existing `response.definition`.

This is not a renderer, hosted survey product, or SurveyJS plugin.

## Packages

| Package                                     | Purpose                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| [`@dimah-survey/core`](./packages/core)     | Protocol, browser clients, schemas, errors, and store types        |
| [`@dimah-survey/server`](./packages/server) | Server factory, guards, validation, handlers, and runtime adapters |
| [`@dimah-survey/react`](./packages/react)   | SurveyJS `Model` and Creator bindings without renderer wrappers    |
| [`@dimah-survey/db`](./packages/db)         | SQL `SurveyStore` and application-owned schema references          |

## Documentation

Read the [quickstart](https://survey.dimah.dev/docs/quickstart), explore the
[example application](https://survey.dimah.dev/docs/example), or open the
[HTTP protocol](https://survey.dimah.dev/docs/protocol).

The complete documentation is published at
[survey.dimah.dev](https://survey.dimah.dev).

## Run the example

The Next.js example uses all four packages with SQLite, Survey Creator, and a
cookie-backed respondent:

```bash
pnpm install
pnpm example
```

See [`examples/next`](./examples/next) for its routes and architecture.

## Development

Node 24+ and pnpm 12+ are required.

```bash
pnpm check-types
pnpm test
```

Run `pnpm dev:docs` for the documentation site on
[localhost:3001](http://localhost:3001). Setup, pull requests, and the release
policy are in [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
