import { describe, expect, it } from "vitest";

import { APIError, isAPIError } from "./error";
import { SURVEY_ERROR_CODES } from "./error-codes";

describe("APIError", () => {
  it("exposes the protocol code", () => {
    const error = APIError.from("CONFLICT", SURVEY_ERROR_CODES.STALE_UPDATE);
    expect(isAPIError(error)).toBe(true);
    expect(error.code).toBe(SURVEY_ERROR_CODES.STALE_UPDATE.code);
    expect(error.message).toBe(SURVEY_ERROR_CODES.STALE_UPDATE.message);
    expect(isAPIError(new Error("offline"))).toBe(false);
    expect(isAPIError(null)).toBe(false);
  });

  it("keeps question names and a cause on the body", () => {
    const cause = new Error("db");
    const error = new APIError("BAD_REQUEST", {
      message: "Survey result is invalid.",
      code: SURVEY_ERROR_CODES.VALIDATION_FAILED.code,
      questions: ["q1"],
      cause,
    });
    expect(error.cause).toBe(cause);
    expect(error.body).toMatchObject({
      code: SURVEY_ERROR_CODES.VALIDATION_FAILED.code,
      questions: ["q1"],
    });
  });
});
