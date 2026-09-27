import { describe, expect, it } from "vitest";

import { DEFAULT_SURVEY_SETTINGS } from "./settings";
import {
  LIST_MAX_LIMIT,
  listResponsesQuerySchema,
  saveSurveyBodySchema,
  surveyResultSchema,
  surveySettingsSchema,
} from "./schemas";

describe("surveySettingsSchema", () => {
  it("requires closesAt to be after opensAt", () => {
    const opensAt = "2026-09-01T00:00:00.000Z";
    const closesAt = "2026-09-02T00:00:00.000Z";
    expect(
      surveySettingsSchema.safeParse({
        ...DEFAULT_SURVEY_SETTINGS,
        opensAt,
        closesAt,
      }).success,
    ).toBe(true);
    expect(
      surveySettingsSchema.safeParse({
        ...DEFAULT_SURVEY_SETTINGS,
        opensAt,
        closesAt: opensAt,
      }).success,
    ).toBe(false);
    expect(
      surveySettingsSchema.safeParse({
        ...DEFAULT_SURVEY_SETTINGS,
        opensAt: closesAt,
        closesAt: opensAt,
      }).success,
    ).toBe(false);
    expect(
      surveySettingsSchema.safeParse({
        ...DEFAULT_SURVEY_SETTINGS,
        opensAt: " 2026-09-01T00:00:00.000Z ",
        closesAt: " 2026-09-02T00:00:00.000Z ",
      }).success,
    ).toBe(true);
  });
});

describe("request schemas", () => {
  it("rejects an empty id and a non-object result", () => {
    expect(
      saveSurveyBodySchema.safeParse({ id: "", draftJson: {} }).success,
    ).toBe(false);
    expect(
      saveSurveyBodySchema.safeParse({ id: "pulse", draftJson: {} }).success,
    ).toBe(true);
    expect(surveyResultSchema.safeParse({ q1: "yes" }).success).toBe(true);
    expect(surveyResultSchema.safeParse([]).success).toBe(false);
  });

  it("coerces a list page and caps it", () => {
    expect(
      listResponsesQuerySchema.safeParse({ limit: "2", offset: "0" }).data,
    ).toEqual({
      limit: 2,
      offset: 0,
    });
    expect(
      listResponsesQuerySchema.safeParse({ limit: LIST_MAX_LIMIT + 1 }).success,
    ).toBe(false);
    expect(listResponsesQuerySchema.safeParse({ limit: 0 }).success).toBe(
      false,
    );
    expect(listResponsesQuerySchema.safeParse({ offset: -1 }).success).toBe(
      false,
    );
    expect(
      listResponsesQuerySchema.safeParse({ include: "full" }).success,
    ).toBe(true);
    expect(listResponsesQuerySchema.safeParse({ include: "raw" }).success).toBe(
      false,
    );
    expect(listResponsesQuerySchema.safeParse(undefined).success).toBe(true);
  });
});
