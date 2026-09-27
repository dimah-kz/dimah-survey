# @dimah-survey/core

Typed protocol primitives for the
[dimah-survey](https://survey.dimah.dev) response lifecycle.

Use this package for non-React browser clients, shared protocol code, or a
custom persistence adapter. Most React applications consume its clients
through `@dimah-survey/react`.

## Install

```bash
npm i @dimah-survey/core
```

Published on npm, still before `1.0.0`. A release may change the API.

## Create a browser client

```ts
import { createFillClient } from "@dimah-survey/core";

const fill = createFillClient({ baseURL: "/api/survey" });
const response = await fill.startResponse({ surveyId: "welcome" });
```

Browser methods take flat objects. Server-side `fill.api` and `editor.api`
instead take `{ body }` or `{ query }`.

## Includes

- fill and editor clients
- route and base-path constants
- Zod payload schemas
- `APIError` and stable survey error codes
- settings and pagination helpers
- domain types and the `SurveyStore` contract
- `createSurveyFetch()` for lower-level better-fetch control

SurveyJS is intentionally not a runtime dependency of `core`.

## Documentation

- [HTTP protocol](https://survey.dimah.dev/docs/protocol)
- [Package map](https://survey.dimah.dev/docs/packages)
- [Errors](https://survey.dimah.dev/docs/errors)

## License

MIT
