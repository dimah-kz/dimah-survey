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
  const { model, error, saveError, stale, reload } = useSurveyResponse({
    client,
    responseId,
  });
  if (error) return <p>{error.message}</p>;
  if (!model) return null;
  return (
    <>
      {saveError ? <p>{saveError.message}</p> : null}
      {stale ? <button onClick={reload}>Reload</button> : null}
      <Survey model={model} />
    </>
  );
}
```

`error` means the snapshot did not load. A failed partial save or submit sets `saveError` and leaves the model mounted. `stale` is `STALE_UPDATE`; `reload` reads the stored snapshot again.

`survey-react-ui` stays in the app. Partial save and complete go through the client.

File and signature questions set `storeDataAsText` to `false`. Handle `onUploadFiles`, `onDownloadFile`, and `onClearFiles` on this `model`. Give SurveyJS `{ file, content }` where `content` is your URL. That URL is what partial save writes into `data`. This package does not store file bytes.

## License

MIT
