import { describe, expect, it } from "vitest";

import { SURVEY_ERROR_CODES } from "./error-codes";
import {
  DEFAULT_SURVEY_SETTINGS,
  assertSurveyAccepting,
  existingResponseForStart,
  readSurveySettings,
} from "./settings";
import type { ResponseRecord } from "./types";

const now = Date.parse("2026-09-27T12:00:00.000Z");

function response(id: string): ResponseRecord {
  return {
    id,
    surveyId: "pulse",
    respondentId: "user-1",
    status: "draft",
    definition: {},
    data: {},
    createdAt: "2026-09-27T00:00:00.000Z",
    updatedAt: "2026-09-27T00:00:00.000Z",
    submittedAt: null,
  };
}

function closed(settings: Parameters<typeof assertSurveyAccepting>[0]) {
  try {
    assertSurveyAccepting(settings, now);
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("assertSurveyAccepting", () => {
  it("treats opensAt and closesAt as inclusive", () => {
    const atNow = new Date(now).toISOString();
    expect(() =>
      assertSurveyAccepting(
        { ...DEFAULT_SURVEY_SETTINGS, opensAt: atNow, closesAt: atNow },
        now,
      ),
    ).not.toThrow();
    expect(
      closed({
        ...DEFAULT_SURVEY_SETTINGS,
        opensAt: new Date(now + 1).toISOString(),
      }),
    ).toMatchObject({ code: SURVEY_ERROR_CODES.SURVEY_CLOSED.code });
    expect(
      closed({
        ...DEFAULT_SURVEY_SETTINGS,
        closesAt: new Date(now - 1).toISOString(),
      }),
    ).toMatchObject({ code: SURVEY_ERROR_CODES.SURVEY_CLOSED.code });
  });
});

describe("existingResponseForStart", () => {
  const openDraft = response("open");
  const latest = response("latest");

  it("always inserts for an anonymous start", () => {
    expect(
      existingResponseForStart({
        settings: DEFAULT_SURVEY_SETTINGS,
        openDraft,
        latest,
      }),
    ).toBeNull();
  });

  it("returns the latest row for a single response and the open draft otherwise", () => {
    expect(
      existingResponseForStart({
        settings: { ...DEFAULT_SURVEY_SETTINGS, responses: "single" },
        respondentId: "user-1",
        openDraft,
        latest,
      }),
    ).toBe(latest);
    expect(
      existingResponseForStart({
        settings: DEFAULT_SURVEY_SETTINGS,
        respondentId: "user-1",
        openDraft,
        latest,
      }),
    ).toBe(openDraft);
    expect(
      existingResponseForStart({
        settings: DEFAULT_SURVEY_SETTINGS,
        respondentId: "user-1",
        openDraft: null,
        latest,
      }),
    ).toBeNull();
  });
});

describe("readSurveySettings", () => {
  it("fills missing and invalid values from the defaults", () => {
    expect(readSurveySettings(null)).toEqual(DEFAULT_SURVEY_SETTINGS);
    expect(
      readSurveySettings({ responses: "single", maxResponses: 0 }),
    ).toEqual({
      ...DEFAULT_SURVEY_SETTINGS,
      responses: "single",
    });
  });
});
