import { describe, expect, it } from "vitest";

import { DEFAULT_SURVEY_SETTINGS } from "@dimah-survey/core";
import type { ResponseRecord, SurveyRecord } from "@dimah-survey/core";

import { responseWriteLanded, surveyWriteLanded } from "./cas";

const writtenSurvey: SurveyRecord = {
  id: "a",
  slug: "pulse",
  status: "active",
  draftJson: { title: "v2", pages: [] },
  publishedJson: { title: "v2" },
  publishedAt: "2020-01-01T00:00:01.200Z",
  settings: { ...DEFAULT_SURVEY_SETTINGS },
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-01T00:00:01.200Z",
};

describe("surveyWriteLanded", () => {
  it("accepts a read-back that matches the written row within one second", () => {
    const fresh: SurveyRecord = {
      ...writtenSurvey,
      draftJson: { pages: [], title: "v2" },
      updatedAt: "2020-01-01T00:00:01.000Z",
      publishedAt: "2020-01-01T00:00:01.000Z",
    };
    expect(surveyWriteLanded(fresh, writtenSurvey)).toBe(true);
  });

  it("rejects a row that still has the previous token", () => {
    const fresh: SurveyRecord = {
      ...writtenSurvey,
      updatedAt: "2020-01-01T00:00:00.100Z",
      publishedAt: "2020-01-01T00:00:00.100Z",
    };
    expect(surveyWriteLanded(fresh, writtenSurvey)).toBe(false);
  });

  it("rejects a row whose collection settings differ", () => {
    const fresh: SurveyRecord = {
      ...writtenSurvey,
      settings: { ...DEFAULT_SURVEY_SETTINGS, reopen: false },
    };
    expect(surveyWriteLanded(fresh, writtenSurvey)).toBe(false);
  });

  it("rejects another writer's row even when the timestamp is close", () => {
    const fresh: SurveyRecord = {
      ...writtenSurvey,
      draftJson: { title: "other" },
      updatedAt: "2020-01-01T00:00:01.400Z",
    };
    expect(surveyWriteLanded(fresh, writtenSurvey)).toBe(false);
  });
});

describe("responseWriteLanded", () => {
  const written: ResponseRecord = {
    id: "r",
    surveyId: "a",
    respondentId: "user-1",
    status: "submitted",
    definition: { title: "v1" },
    data: { q1: "yes" },
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:02.500Z",
    submittedAt: "2020-01-01T00:00:02.500Z",
  };

  it("accepts the submitted row we just wrote", () => {
    expect(
      responseWriteLanded(
        {
          ...written,
          data: { q1: "yes" },
          updatedAt: "2020-01-01T00:00:02.000Z",
        },
        written,
      ),
    ).toBe(true);
  });

  it("rejects a draft that another request left in place", () => {
    expect(
      responseWriteLanded(
        {
          ...written,
          status: "draft",
          submittedAt: null,
          updatedAt: "2020-01-01T00:00:02.100Z",
        },
        written,
      ),
    ).toBe(false);
  });
});
