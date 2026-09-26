import { isAPIError, SURVEY_ERROR_CODES } from "@dimah-survey/core";

const MISSING = new Set<string>([
  SURVEY_ERROR_CODES.NOT_FOUND.code,
  SURVEY_ERROR_CODES.FORBIDDEN.code,
  SURVEY_ERROR_CODES.SURVEY_NOT_FOUND.code,
  SURVEY_ERROR_CODES.RESPONSE_NOT_FOUND.code,
]);

export function isMissing(error: unknown) {
  return (
    isAPIError(error) && error.code !== undefined && MISSING.has(error.code)
  );
}

export function errorMessage(error: unknown) {
  if (isAPIError(error) && error.code === SURVEY_ERROR_CODES.SLUG_TAKEN.code) {
    return "A survey already uses that name.";
  }
  if (isAPIError(error) && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong.";
}
