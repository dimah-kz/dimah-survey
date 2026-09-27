# @dimah-survey/react

Binds SurveyJS `Model` and Creator instances to the dimah-survey lifecycle.
It does not render the survey or Creator; those components stay in your app.

## Install

```bash
npm i @dimah-survey/react react survey-core
```

## Bind a fill session

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

The hook fetches the stored response, builds a `Model` from
`response.definition`, and binds partial save and submit. A non-draft response
opens in display mode.

- `partial: "page"` is the default; it saves on SurveyJS page next.
- `partial: "off"` only writes when the respondent completes.
- `saveError` leaves the Model mounted, and `stale` means the last
  compare-and-swap write lost to another update. Call `reload()` to hydrate the
  stored record again.

## Bind Creator autosave

`useSurveyDraft()` and `bindSurveyCreator()` point Creator autosave at
`saveSurvey`. They update `draftJson` only; `publishSurvey` remains a separate,
explicit action.

Pass the `updatedAt` from the server read that created the Creator instance so
the binding can protect writes with `expectedUpdatedAt`.

## Files

File and signature questions set `storeDataAsText` to `false`. Handle file
upload, download, and deletion on the SurveyJS model in your application; the
response data stores the URL or locator your handler returns, never file bytes.

## Documentation

Read the React Model and Creator guides in
[apps/docs](https://github.com/dimah-kz/dimah-survey/tree/main/apps/docs).

## License

MIT
