import { describe, expect, it } from "vitest";

import { isUniqueViolation } from "./unique";

describe("isUniqueViolation", () => {
  it("matches postgres, sqlite, and the open-draft index", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ code: 23505 })).toBe(true);
    expect(
      isUniqueViolation(
        new Error("UNIQUE constraint failed: dimah_survey.slug"),
      ),
    ).toBe(true);
    expect(isUniqueViolation(new Error("dimah_response_one_open_draft"))).toBe(
      true,
    );
  });

  it("walks a nested cause and ignores other failures", () => {
    expect(isUniqueViolation({ cause: { message: "unique constraint" } })).toBe(
      true,
    );
    expect(isUniqueViolation(new Error("connection reset"))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
