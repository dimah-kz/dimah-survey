import { SURVEY_ERROR_CODES, isAPIError } from "@dimah-survey/core";

/** True when a write lost compare-and-swap against `updatedAt`. */
export function isStaleUpdate(error: unknown): boolean {
  return (
    isAPIError(error) && error.code === SURVEY_ERROR_CODES.STALE_UPDATE.code
  );
}
