export type ErrorCodeEntry = {
  readonly code: string;
  readonly message: string;
};

function defineErrorCodes<const T extends Record<string, string>>(
  messages: T,
): { readonly [K in keyof T]: { readonly code: K; readonly message: T[K] } } {
  const codes = {} as {
    [K in keyof T]: { readonly code: K; readonly message: T[K] };
  };
  for (const code of Object.keys(messages) as (keyof T)[]) {
    codes[code] = { code, message: messages[code] };
  }
  return codes;
}

export const SURVEY_ERROR_CODES = defineErrorCodes({
  NOT_FOUND: "Not found",
  FORBIDDEN: "Forbidden",
  INTERNAL_ERROR: "Internal server error",
  VALIDATION_ERROR: "Validation error",
  SURVEY_NOT_FOUND: "Survey was not found.",
  NOT_PUBLISHED: "Only an active published survey can be started.",
  SURVEY_CLOSED: "This survey is not accepting responses.",
  RESPONSE_LIMIT: "This survey has reached its response limit.",
  SLUG_TAKEN: "Slug is already used by another survey.",
  STALE_UPDATE: "The record changed since it was read.",
  RESPONSE_NOT_FOUND: "Response was not found.",
  RESPONSE_CLOSED: "Response is not open for this operation.",
  OPEN_DRAFT: "This respondent already has an open draft for the survey.",
  VALIDATION_FAILED: "Survey result is invalid.",
});

export type SurveyErrorCode = keyof typeof SURVEY_ERROR_CODES;
