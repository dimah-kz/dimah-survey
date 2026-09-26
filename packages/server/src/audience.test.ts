import {
  EDITOR_AUDIENCE_OPERATIONS,
  FILL_AUDIENCE_OPERATIONS,
  SURVEY_ERROR_CODES,
} from "@dimah-survey/core";
import { describe, expect, it } from "vitest";

import { editorSurveyEndpoints, fillSurveyEndpoints } from "./api/routes";
import { dimahSurvey, type DimahSurveyConfig } from "./dimah-survey";
import { memoryAdapter } from "./memory";
import { guardRespondent } from "./respondent";

const definition = { title: "v1", pages: [{ name: "p" }] };

describe("audience routes", () => {
  it("mounts each operation list and nothing else", () => {
    expect(Object.keys(fillSurveyEndpoints).sort()).toEqual(
      [...FILL_AUDIENCE_OPERATIONS].sort(),
    );
    expect(Object.keys(editorSurveyEndpoints).sort()).toEqual(
      [...EDITOR_AUDIENCE_OPERATIONS].sort(),
    );
  });

  it("refuses to build a fill handler without guard", () => {
    const build = dimahSurvey as (config: DimahSurveyConfig) => unknown;
    expect(() =>
      build({ audience: "fill", database: memoryAdapter() }),
    ).toThrow(/requires guard/);
  });

  it("does not serve fill writes from the editor handler", async () => {
    const editor = dimahSurvey({
      audience: "editor",
      database: memoryAdapter(),
      validateResult: () => undefined,
    });
    const response = await editor.handler(
      new Request("http://survey.local/api/admin/survey/response/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ surveyId: "pulse" }),
      }),
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: SURVEY_ERROR_CODES.NOT_FOUND.code,
    });
  });

  it("rejects an editor guard that returns a respondent", async () => {
    const editor = dimahSurvey({
      audience: "editor",
      database: memoryAdapter(),
      validateResult: () => undefined,
      guard: () => ({ respondentId: "user-1" }),
    });
    await expect(
      editor.api.saveSurvey({ body: { id: "pulse", draftJson: definition } }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });
  });

  it("rejects a fill guard that returns nothing", async () => {
    const fill = dimahSurvey({
      audience: "fill",
      database: memoryAdapter(),
      validateResult: () => undefined,
      guard: () => undefined,
    });
    await expect(
      fill.api.startResponse({ body: { surveyId: "pulse" } }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });
  });

  it("keeps publish off the fill handler when the guard is a respondent", async () => {
    const fill = dimahSurvey({
      audience: "fill",
      database: memoryAdapter(),
      basePath: "/api/fill",
      validateResult: () => undefined,
      guard: (context) => guardRespondent("user-1")(context),
    });
    const response = await fill.handler(
      new Request("http://survey.local/api/fill/survey/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "pulse" }),
      }),
    );
    expect(response.status).toBe(404);
  });
});
