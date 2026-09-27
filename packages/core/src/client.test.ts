import { describe, expect, it } from "vitest";

import { createEditorClient } from "./client";
import {
  normalizeSurveyApiBasePath,
  SURVEY_EDITOR_API_BASE_PATH,
} from "./routes";

describe("normalizeSurveyApiBasePath", () => {
  it("defaults to the fill mount and trims a trailing slash", () => {
    expect(normalizeSurveyApiBasePath()).toBe("/api/survey");
    expect(normalizeSurveyApiBasePath("api/admin/survey/")).toBe(
      "/api/admin/survey",
    );
    expect(
      normalizeSurveyApiBasePath("http://survey.local/api/admin/survey/"),
    ).toBe("http://survey.local/api/admin/survey");
  });
});

describe("createEditorClient", () => {
  it("defaults baseURL to the editor mount", async () => {
    const seen: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      seen.push(input instanceof Request ? input.url : String(input));
      return Response.json({ id: "pulse" });
    };
    const client = createEditorClient({ fetch: fetchImpl });
    await client.getSurvey("pulse");
    expect(seen[0]).toContain(`${SURVEY_EDITOR_API_BASE_PATH}/survey`);
  });
});
