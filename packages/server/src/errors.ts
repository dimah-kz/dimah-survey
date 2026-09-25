import { APIError, SURVEY_ERROR_CODES, isAPIError } from "@dimah-survey/core";

export { APIError, isAPIError };

export const errors = {
  notFound: () => APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.NOT_FOUND),
  forbidden: () => APIError.from("FORBIDDEN", SURVEY_ERROR_CODES.FORBIDDEN),
  surveyNotFound: () =>
    APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.SURVEY_NOT_FOUND),
  responseNotFound: () =>
    APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.RESPONSE_NOT_FOUND),
  notPublished: () =>
    APIError.from("CONFLICT", SURVEY_ERROR_CODES.NOT_PUBLISHED),
  slugTaken: () => APIError.from("CONFLICT", SURVEY_ERROR_CODES.SLUG_TAKEN),
  staleUpdate: () => APIError.from("CONFLICT", SURVEY_ERROR_CODES.STALE_UPDATE),
  responseClosed: () =>
    APIError.from("CONFLICT", SURVEY_ERROR_CODES.RESPONSE_CLOSED),
  resumeRequiresRespondent: () =>
    APIError.from("BAD_REQUEST", SURVEY_ERROR_CODES.RESUME_REQUIRES_RESPONDENT),
  validationError: (message: string) =>
    APIError.from("BAD_REQUEST", {
      code: SURVEY_ERROR_CODES.VALIDATION_ERROR.code,
      message,
    }),
  validationFailed: (message: string) =>
    APIError.from("BAD_REQUEST", {
      code: SURVEY_ERROR_CODES.VALIDATION_FAILED.code,
      message,
    }),
  internalError: () =>
    APIError.from("INTERNAL_SERVER_ERROR", SURVEY_ERROR_CODES.INTERNAL_ERROR),
};
