# dimah-survey

[![CI](https://github.com/dimah-kz/dimah-survey/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dimah-kz/dimah-survey/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-survey.dimah.dev-0e8a16)](https://survey.dimah.dev)
[![License: MIT](https://img.shields.io/github/license/dimah-kz/dimah-survey)](./LICENSE)

The backend for [SurveyJS](https://surveyjs.io/).

[Better Auth](https://www.better-auth.com)–like: mount it in your app, on your database. SurveyJS stays the form. Authentication and the UI stay yours.

[Documentation](https://survey.dimah.dev) · [Contributing](./CONTRIBUTING.md) · [Support](./SUPPORT.md) · [Security](./SECURITY.md) · [Code of conduct](./CODE_OF_CONDUCT.md)

```bash
npm i @dimah-survey/server @dimah-survey/db @dimah-survey/react survey-core survey-react-ui fumadb
```

Published on npm, still before `1.0.0`. A release may change the API.

## What you get

- Creator and the renderer stay in your application
- A draft, published only when you ask; progress saved, then checked on submit
- Fill and editor HTTP APIs on one store
- Your authentication and your database

## Packages

| Package                                     | Purpose                                                     |
| ------------------------------------------- | ----------------------------------------------------------- |
| [`@dimah-survey/core`](./packages/core)     | Protocol, browser clients, schemas, errors, and store types |
| [`@dimah-survey/server`](./packages/server) | Handlers, guards, validation, and runtime adapters          |
| [`@dimah-survey/react`](./packages/react)   | SurveyJS `Model` and Creator bindings                       |
| [`@dimah-survey/db`](./packages/db)         | SQL store and application-owned schema references           |

Start with the [quickstart](https://survey.dimah.dev/docs/quickstart).

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
