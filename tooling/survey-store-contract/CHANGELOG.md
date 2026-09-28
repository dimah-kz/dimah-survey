## @workspace/survey-store-contract@0.5.0

### Publish each survey document once

Publishing stores an immutable version and points the survey at it. An unchanged document reuses that version. Each response keeps the version id it started with, and a full response list returns each of those versions once.

## @workspace/survey-store-contract@0.4.0

### Export the option types the docs render

`SurveyGuard`, `CreateSurveyClientOptions`, `UseSurveyResponseOptions`, and `UseSurveyDraftOptions` are public. Configuration, settings, store, list, and React binding fields document their defaults and write behavior in JSDoc.

## @workspace/survey-store-contract@0.3.0

### Export the option types the docs render

`SurveyGuard`, `CreateSurveyClientOptions`, `UseSurveyResponseOptions`, and `UseSurveyDraftOptions` are public. Configuration, settings, store, list, and React binding fields document their defaults and write behavior in JSDoc.

## @workspace/survey-store-contract@0.2.0

### Initial release

Publish an editable survey, freeze the definition each response starts with, save drafts, and validate submissions against that snapshot.

## @workspace/survey-store-contract@0.1.0

### Initial release

Publish an editable survey, freeze the definition each response starts with, save drafts, and validate submissions against that snapshot.
