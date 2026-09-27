import { describe, expect, it } from "vitest";

import {
  EDITOR_AUDIENCE_OPERATIONS,
  FILL_AUDIENCE_OPERATIONS,
  SURVEY_API_OPERATIONS,
  SURVEY_API_ROUTE_KEYS,
  normalizeSurveyApiBasePath,
  surveyApiRouteKey,
} from "./routes";

describe("normalizeSurveyApiBasePath", () => {
  it("trims, strips a trailing slash, and keeps an absolute origin", () => {
    expect(normalizeSurveyApiBasePath()).toBe("/api/survey");
    expect(normalizeSurveyApiBasePath("")).toBe("/api/survey");
    expect(normalizeSurveyApiBasePath("   ")).toBe("/api/survey");
    expect(normalizeSurveyApiBasePath("/")).toBe("/api/survey");
    expect(normalizeSurveyApiBasePath("api/admin/survey/")).toBe(
      "/api/admin/survey",
    );
    expect(normalizeSurveyApiBasePath("  /api/fill/ ")).toBe("/api/fill");
    expect(normalizeSurveyApiBasePath("/api/fill///")).toBe("/api/fill");
    expect(
      normalizeSurveyApiBasePath("http://survey.local/api/admin/survey/"),
    ).toBe("http://survey.local/api/admin/survey");
  });
});

describe("audience operations", () => {
  it("splits every route, sharing only the reads an editor and a respondent both need", () => {
    const fill = new Set<string>(FILL_AUDIENCE_OPERATIONS);
    const editor = new Set<string>(EDITOR_AUDIENCE_OPERATIONS);
    expect(
      [...fill].filter((operation) => editor.has(operation)).sort(),
    ).toEqual(["getResponse", "listResponses"]);
    expect([...new Set([...fill, ...editor])].sort()).toEqual(
      Object.keys(SURVEY_API_OPERATIONS).sort(),
    );
  });

  it("gives every method and path one operation", () => {
    const keys = Object.values(SURVEY_API_OPERATIONS).map((spec) =>
      surveyApiRouteKey(spec.method, spec.path),
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(SURVEY_API_ROUTE_KEYS["GET /survey/published"]).toBe(
      "getPublishedSurvey",
    );
    expect(SURVEY_API_ROUTE_KEYS["POST /survey"]).toBe("saveSurvey");
    expect(SURVEY_API_ROUTE_KEYS["GET /survey"]).toBe("getSurvey");
  });
});
