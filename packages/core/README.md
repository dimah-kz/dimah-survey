# @dimah-survey/core

Protocol primitives for the dimah-survey response lifecycle.

It owns route constants, Zod payload schemas, stable errors, fill/editor
clients, settings helpers, list helpers, and the `SurveyStore` contract.

> **Pre-release:** this package is not on npm yet. The code in this repository
> is the current API.

## Use it when

- your browser client is not React
- a shared package needs protocol types, schemas, or error codes
- you are implementing a custom `SurveyStore`

Most applications import the server factory from `@dimah-survey/server` and
browser bindings from `@dimah-survey/react`.

## Create a browser client

```ts
import { createFillClient } from "@dimah-survey/core";

const fill = createFillClient({ baseURL: "/api/survey" });
const response = await fill.startResponse({ surveyId: "welcome" });
```

Client methods take flat objects. In-process server calls instead take
`{ body }` or `{ query }`; see the protocol reference for the complete route
map.

## Documentation

Read the package map, HTTP protocol, and persistence contract in
[apps/docs](https://github.com/dimah-kz/dimah-survey/tree/main/apps/docs).

## License

MIT
