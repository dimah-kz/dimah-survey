import { SURVEY_ERROR_CODES } from "@dimah-survey/core";
import { describe, expect, it } from "vitest";

import { dimahSurvey } from "./dimah-survey";
import { memoryAdapter } from "./memory";
import { checkSurveyResult } from "./validate";

const definition = {
  pages: [
    {
      name: "p",
      elements: [
        { type: "text", name: "q1", isRequired: true },
        { type: "radiogroup", name: "q2", choices: ["a", "b"] },
      ],
    },
  ],
};

describe("checkSurveyResult", () => {
  it("strips values that are not part of the snapshot", () => {
    const data = checkSurveyResult({
      definition,
      data: { q1: "ok", q2: "nope", extra: 1 },
    });
    expect(data).toEqual({ q1: "ok" });
  });

  it("rejects a missing required answer", () => {
    expect(() => checkSurveyResult({ definition, data: {} })).toThrow(
      expect.objectContaining({
        code: SURVEY_ERROR_CODES.VALIDATION_FAILED.code,
      }),
    );
  });

  it("stores the cleaned data on submit", async () => {
    const survey = dimahSurvey({ database: memoryAdapter() });
    await survey.api.saveSurvey({
      body: { id: "pulse", draftJson: definition },
    });
    await survey.api.publishSurvey({ body: { id: "pulse" } });
    const started = await survey.api.startResponse({
      body: { surveyId: "pulse" },
    });
    const submitted = await survey.api.submitResponse({
      body: {
        id: started.id,
        data: { q1: "ok", q2: "nope" },
        expectedUpdatedAt: started.updatedAt,
      },
    });
    expect(submitted.data).toEqual({ q1: "ok" });
    expect(submitted.definition).toEqual(definition);
  });
});
