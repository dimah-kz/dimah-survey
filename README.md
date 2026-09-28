# dimah-survey

[![CI](https://github.com/dimah-kz/dimah-survey/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dimah-kz/dimah-survey/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-survey.dimah.dev-0e8a16)](https://survey.dimah.dev)
[![License: MIT](https://img.shields.io/github/license/dimah-kz/dimah-survey)](./LICENSE)

Backend for [SurveyJS](https://surveyjs.io/) surveys.

Store each survey, publish it, save progress, and collect submissions in your
own application. SurveyJS draws the form. Authentication, the database, and
the UI stay with you. The architecture matches
[Better Auth](https://www.better-auth.com): a library you mount in your app,
on your database.

[Documentation](https://survey.dimah.dev) · [Contributing](./CONTRIBUTING.md) · [Support](./SUPPORT.md) · [Security](./SECURITY.md) · [Code of conduct](./CODE_OF_CONDUCT.md)

```bash
npm i @dimah-survey/server @dimah-survey/db @dimah-survey/react survey-core survey-react-ui fumadb
```

Published on npm, still before `1.0.0`. A release may change the API.

## What you get

- an editor draft, published only when you ask
- fill and editor HTTP APIs on one store
- progress saved while someone answers, then checked on submit
- collection windows, response limits, and concurrent-write checks
- each response keeps the survey it started with

SurveyJS remains the form UI. This library is the backend.

## Packages

| Package                                     | Purpose                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| [`@dimah-survey/core`](./packages/core)     | Protocol, browser clients, schemas, errors, and store types        |
| [`@dimah-survey/server`](./packages/server) | Server factory, guards, validation, handlers, and runtime adapters |
| [`@dimah-survey/react`](./packages/react)   | SurveyJS `Model` and Creator bindings                              |
| [`@dimah-survey/db`](./packages/db)         | SQL `SurveyStore` and application-owned schema references          |

## Documentation

Read the [quickstart](https://survey.dimah.dev/docs/quickstart) or open the
[HTTP protocol](https://survey.dimah.dev/docs/protocol).

The complete documentation is published at
[survey.dimah.dev](https://survey.dimah.dev).

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
