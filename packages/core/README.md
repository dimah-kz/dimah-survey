# @dimah-survey/core

Routes, Zod payloads, errors, and the better-fetch client for the dimah-survey response lifecycle.

Most applications should install `@dimah-survey/server` and `@dimah-survey/react`. Install Core directly for a non-React client or shared protocol types.

## Install

```bash
pnpm add @dimah-survey/core
```

```ts
import { createSurveyClient } from "@dimah-survey/core";

const survey = createSurveyClient({ baseURL: "/api/survey" });
const response = await survey.startResponse({ surveyId });
```

## License

MIT
