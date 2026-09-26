# @dimah-survey/react

Binds a survey-core `Model` to the dimah-survey lifecycle. It does not render the survey. The app still mounts `<Survey model={model} />`.

## Install

```bash
pnpm add @dimah-survey/react survey-core react
```

```tsx
import { createFillClient, useSurveyResponse } from "@dimah-survey/react";
import { Survey } from "survey-react-ui";

const client = createFillClient({ baseURL: "/api/survey" });

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

Creator stays in the app too. `bindSurveyCreator` / `useSurveyDraft` point autosave at `saveSurvey` (`draftJson` only) and send `expectedUpdatedAt` from the loaded survey. Publish is a separate `publishSurvey` call.

```tsx
import { useMemo } from "react";
import { createEditorClient, useSurveyDraft } from "@dimah-survey/react";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";

const editor = createEditorClient({ baseURL: "/api/admin/survey" });

export function Design({
  surveyId,
  draftJson,
  updatedAt,
}: {
  surveyId: string;
  draftJson: object;
  updatedAt: string;
}) {
  const creator = useMemo(() => {
    const next = new SurveyCreator();
    next.JSON = draftJson;
    return next;
  }, [draftJson]);
  const { saveError, stale } = useSurveyDraft({
    client: editor,
    surveyId,
    creator,
    updatedAt,
  });
  return (
    <>
      {saveError ? <p>{saveError.message}</p> : null}
      {stale ? <p>This draft was saved somewhere else.</p> : null}
      <SurveyCreatorComponent creator={creator} />
    </>
  );
}
```

File and signature questions set `storeDataAsText` to `false`. Handle `onUploadFiles`, `onDownloadFile`, and `onClearFiles` on this `model`. Give SurveyJS `{ file, content }` where `content` is your URL. That URL is what partial save writes into `data`. This package does not store file bytes.

## License

MIT
