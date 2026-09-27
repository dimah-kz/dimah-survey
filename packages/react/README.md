# @dimah-survey/react

React bindings for SurveyJS responses and Creator drafts in
[dimah-survey](https://survey.dimah.dev).

The package hydrates and binds SurveyJS objects; your application still renders
them directly.

## Install

```bash
npm i @dimah-survey/react survey-core survey-react-ui
```

## Render a response snapshot

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

`useSurveyResponse()` builds the model from `response.definition`, restores
stored data, and binds partial save and submit.

## Includes

- `useSurveyResponse()` and `bindSurveyModel()` for fill sessions
- `useSurveyDraft()` and `bindSurveyCreator()` for Creator autosave
- `createFillClient()` and `createEditorClient()` from `@dimah-survey/core`
- stale-write state and compare-and-swap support
- file/signature setup that keeps bytes in your application

`partial: "page"` saves the complete SurveyJS data object on page next.
`partial: "off"` writes only on completion. Failed writes leave the model
mounted; `reload()` hydrates the stored row after `STALE_UPDATE`.

## Survey Creator

Install `survey-creator-core` and `survey-creator-react` in the application.
`useSurveyDraft()` sends Creator autosave to `draftJson`; publishing remains a
separate editor operation.

## File questions

File and signature questions set `storeDataAsText` to `false`. Handle file
upload, download, and deletion on the SurveyJS model in your application; the
response stores the URL or locator, never file bytes.

## Documentation

- [Fill with React](https://survey.dimah.dev/docs/react)
- [Survey Creator](https://survey.dimah.dev/docs/creator)

## License

MIT
