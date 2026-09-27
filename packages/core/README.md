# @dimah-survey/core

Protocol primitives for the dimah-survey response lifecycle.

It owns route constants, Zod payload schemas, stable errors, fill/editor
clients, settings helpers, list helpers, and the `SurveyStore` contract.

## Install

```bash
npm i @dimah-survey/core
```

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

<https://survey.dimah.dev/docs/protocol> covers routes, client methods, and the
in-process server API. The [package map](https://survey.dimah.dev/docs/packages)
and [error reference](https://survey.dimah.dev/docs/errors) sit beside it.

## License

MIT
