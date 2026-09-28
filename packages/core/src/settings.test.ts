import { describe, expect, it } from "vitest";

import { SURVEY_ERROR_CODES } from "./error-codes";
import {
  DEFAULT_SURVEY_SETTINGS,
  assertReopenAllowed,
  assertResponseLimit,
  assertSurveyAccepting,
  existingResponseForStart,
  readSurveySettings,
  toPublishedSurvey,
} from "./settings";
import type { ResponseRecord, SurveyRecord } from "./types";

const now = Date.parse("2026-09-27T12:00:00.000Z");

function response(id: string): ResponseRecord {
  return {
    id,
    surveyId: "pulse",
    respondentId: "user-1",
    status: "draft",
    versionId: "version-1",
    definition: {},
    data: {},
    createdAt: "2026-09-27T00:00:00.000Z",
    updatedAt: "2026-09-27T00:00:00.000Z",
    submittedAt: null,
  };
}

function survey(patch: Partial<SurveyRecord> = {}): SurveyRecord {
  return {
    id: "pulse",
    slug: "pulse",
    status: "active",
    draftJson: { title: "draft" },
    publishedVersionId: "version-1",
    publishedJson: { title: "live" },
    publishedAt: "2026-09-27T00:00:00.000Z",
    settings: DEFAULT_SURVEY_SETTINGS,
    createdAt: "2026-09-27T00:00:00.000Z",
    updatedAt: "2026-09-27T00:00:00.000Z",
    ...patch,
  };
}

describe("readSurveySettings", () => {
  it("fills missing and invalid values from the defaults", () => {
    expect(readSurveySettings(null)).toEqual(DEFAULT_SURVEY_SETTINGS);
    expect(readSurveySettings([])).toEqual(DEFAULT_SURVEY_SETTINGS);
    expect(readSurveySettings("nope")).toEqual(DEFAULT_SURVEY_SETTINGS);
    expect(
      readSurveySettings({
        responses: "single",
        reopen: false,
        opensAt: "2026-09-01T00:00:00.000Z",
        closesAt: "2026-10-01T00:00:00.000Z",
        maxResponses: 2,
      }),
    ).toEqual({
      responses: "single",
      reopen: false,
      opensAt: "2026-09-01T00:00:00.000Z",
      closesAt: "2026-10-01T00:00:00.000Z",
      maxResponses: 2,
    });
    expect(
      readSurveySettings({ responses: "single", maxResponses: 0 }),
    ).toEqual({
      ...DEFAULT_SURVEY_SETTINGS,
      responses: "single",
    });
    expect(
      readSurveySettings({ responses: "single", maxResponses: 1.5 }),
    ).toEqual({
      ...DEFAULT_SURVEY_SETTINGS,
      responses: "single",
    });
  });

  it("drops the whole object when the window cannot be parsed", () => {
    expect(
      readSurveySettings({ responses: "single", opensAt: "yesterday" }),
    ).toEqual(DEFAULT_SURVEY_SETTINGS);
    expect(
      readSurveySettings({
        responses: "single",
        opensAt: "2026-10-01T00:00:00.000Z",
        closesAt: "2026-09-01T00:00:00.000Z",
      }),
    ).toEqual(DEFAULT_SURVEY_SETTINGS);
  });
});

describe("assertSurveyAccepting", () => {
  it("treats opensAt and closesAt as inclusive", () => {
    const atNow = new Date(now).toISOString();
    expect(() =>
      assertSurveyAccepting(
        { ...DEFAULT_SURVEY_SETTINGS, opensAt: atNow, closesAt: atNow },
        now,
      ),
    ).not.toThrow();
    expect(() =>
      assertSurveyAccepting(
        { ...DEFAULT_SURVEY_SETTINGS, opensAt: "not-a-date" },
        now,
      ),
    ).not.toThrow();
    expect(() =>
      assertSurveyAccepting(
        {
          ...DEFAULT_SURVEY_SETTINGS,
          opensAt: new Date(now + 1).toISOString(),
        },
        now,
      ),
    ).toThrow(
      expect.objectContaining({ code: SURVEY_ERROR_CODES.SURVEY_CLOSED.code }),
    );
    expect(() =>
      assertSurveyAccepting(
        {
          ...DEFAULT_SURVEY_SETTINGS,
          closesAt: new Date(now - 1).toISOString(),
        },
        now,
      ),
    ).toThrow(
      expect.objectContaining({ code: SURVEY_ERROR_CODES.SURVEY_CLOSED.code }),
    );
  });
});

describe("assertResponseLimit", () => {
  it("counts only a positive cap", () => {
    expect(() =>
      assertResponseLimit(DEFAULT_SURVEY_SETTINGS, 100),
    ).not.toThrow();
    expect(() =>
      assertResponseLimit({ ...DEFAULT_SURVEY_SETTINGS, maxResponses: 2 }, 1),
    ).not.toThrow();
    expect(() =>
      assertResponseLimit({ ...DEFAULT_SURVEY_SETTINGS, maxResponses: 2 }, 2),
    ).toThrow(
      expect.objectContaining({ code: SURVEY_ERROR_CODES.RESPONSE_LIMIT.code }),
    );
  });
});

describe("assertReopenAllowed", () => {
  it("rejects a survey that disallows reopen", () => {
    expect(() => assertReopenAllowed(DEFAULT_SURVEY_SETTINGS)).not.toThrow();
    expect(() =>
      assertReopenAllowed({ ...DEFAULT_SURVEY_SETTINGS, reopen: false }),
    ).toThrow(
      expect.objectContaining({
        code: SURVEY_ERROR_CODES.RESPONSE_CLOSED.code,
      }),
    );
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
    expect(
      existingResponseForStart({
        settings: { ...DEFAULT_SURVEY_SETTINGS, responses: "single" },
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
        settings: { ...DEFAULT_SURVEY_SETTINGS, responses: "single" },
        respondentId: "user-1",
        openDraft,
        latest: null,
      }),
    ).toBeNull();
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

describe("toPublishedSurvey", () => {
  it("returns the live document without the editor draft", () => {
    expect(toPublishedSurvey(survey())).toEqual({
      id: "pulse",
      slug: "pulse",
      publishedVersionId: "version-1",
      publishedJson: { title: "live" },
      publishedAt: "2026-09-27T00:00:00.000Z",
      settings: DEFAULT_SURVEY_SETTINGS,
    });
  });

  it("returns null until the survey is active and published", () => {
    expect(toPublishedSurvey(survey({ status: "draft" }))).toBeNull();
    expect(toPublishedSurvey(survey({ status: "archived" }))).toBeNull();
    expect(toPublishedSurvey(survey({ publishedJson: null }))).toBeNull();
    expect(toPublishedSurvey(survey({ publishedAt: null }))).toBeNull();
  });
});
