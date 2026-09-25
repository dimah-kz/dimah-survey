export const errorCodes = {
  SURVEY_NOT_FOUND: "SURVEY_NOT_FOUND",
  NOT_PUBLISHED: "NOT_PUBLISHED",
  SLUG_TAKEN: "SLUG_TAKEN",
  STALE_UPDATE: "STALE_UPDATE",
  RESPONSE_NOT_FOUND: "RESPONSE_NOT_FOUND",
  RESPONSE_CLOSED: "RESPONSE_CLOSED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_BODY: "INVALID_BODY",
  REQUEST_FAILED: "REQUEST_FAILED",
} as const;

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];

export class SurveyError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string, status: number) {
    super(message);
    this.name = "SurveyError";
    this.code = code;
    this.status = status;
  }
}

export function assertFresh(updatedAt: string, expectedUpdatedAt?: string) {
  if (expectedUpdatedAt !== undefined && expectedUpdatedAt !== updatedAt) {
    throw new SurveyError(
      errorCodes.STALE_UPDATE,
      "The record changed since it was read.",
      409,
    );
  }
}
