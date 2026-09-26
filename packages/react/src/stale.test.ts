import { APIError, SURVEY_ERROR_CODES } from "@dimah-survey/core";
import { describe, expect, it } from "vitest";

import { isStaleUpdate } from "./stale";

describe("isStaleUpdate", () => {
  it("matches the compare-and-swap conflict", () => {
    expect(
      isStaleUpdate(APIError.from("CONFLICT", SURVEY_ERROR_CODES.STALE_UPDATE)),
    ).toBe(true);
  });

  it("ignores other failures", () => {
    expect(isStaleUpdate(new Error("offline"))).toBe(false);
    expect(
      isStaleUpdate(APIError.from("FORBIDDEN", SURVEY_ERROR_CODES.FORBIDDEN)),
    ).toBe(false);
  });
});
