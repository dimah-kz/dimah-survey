# @dimah-survey/react

Binds a survey-core `Model` to the dimah-survey lifecycle. It does not render the survey. The app still mounts `<Survey model={model} />`.

## Install

```bash
pnpm add @dimah-survey/react survey-core react
```

```tsx
import { createSurveyClient } from "@dimah-survey/react";
import { useSurveyResponse } from "@dimah-survey/react";
import { Survey } from "survey-react-ui";

const client = createSurveyClient({ baseURL: "/api/survey" });

export function Fill({ responseId }: { responseId: string }) {
  const { model, error } = useSurveyResponse({ client, responseId });
  if (error) return <p>{error.message}</p>;
  if (!model) return null;
  return <Survey model={model} />;
}
```

`survey-react-ui` stays in the app. Partial save and complete go through the client.

## License

MIT
