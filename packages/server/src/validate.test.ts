import { SURVEY_ERROR_CODES } from "@dimah-survey/core";
import { describe, expect, it } from "vitest";

import { createSession } from "./test/session";
import { checkSurveyResult, clearSurveyResult } from "./validate";

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
        body: expect.objectContaining({ questions: ["q1"] }),
      }),
    );
  });

  it("keeps a choicesByUrl answer and still strips other incorrect values", () => {
    const withRemote = {
      pages: [
        {
          name: "p",
          elements: [
            { type: "text", name: "q1", isRequired: true },
            {
              type: "dropdown",
              name: "country",
              choicesByUrl: { url: "https://example.invalid/countries" },
            },
            { type: "radiogroup", name: "q2", choices: ["a", "b"] },
          ],
        },
      ],
    };
    const data = checkSurveyResult({
      definition: withRemote,
      data: { q1: "ok", country: "fr", q2: "nope", extra: 1 },
    });
    expect(data).toEqual({ q1: "ok", country: "fr" });
  });

  it("keeps a choicesByUrl answer nested in a panel", () => {
    const data = checkSurveyResult({
      definition: {
        pages: [
          {
            name: "p",
            elements: [
              { type: "text", name: "q1", isRequired: true },
              {
                type: "panel",
                name: "group",
                elements: [
                  {
                    type: "dropdown",
                    name: "country",
                    choicesByUrl: { url: "https://example.invalid/countries" },
                  },
                ],
              },
            ],
          },
        ],
      },
      data: { q1: "ok", country: "fr", extra: 1 },
    });
    expect(data).toEqual({ q1: "ok", country: "fr" });
  });
});

describe("clearSurveyResult", () => {
  it("drops incorrect values without requiring an answer", () => {
    expect(
      clearSurveyResult({ definition, data: { q2: "nope", extra: 1 } }),
    ).toEqual({});
  });
});

describe("submit validation", () => {
  it("stores the cleaned data and returns failed question names", async () => {
    const { editor, fill } = createSession();
    await editor.saveSurvey({ id: "pulse", draftJson: definition });
    await editor.publishSurvey({ id: "pulse" });
    const started = await fill.startResponse({ surveyId: "pulse" });
    const submitted = await fill.submitResponse({
      id: started.id,
      data: { q1: "ok", q2: "nope" },
      expectedUpdatedAt: started.updatedAt,
    });
    expect(submitted.data).toEqual({ q1: "ok" });
    expect(submitted.definition).toEqual(definition);

    const replayed = await fill.submitResponse({
      id: started.id,
      data: { q1: "ok", q2: "nope", extra: 1 },
      expectedUpdatedAt: started.updatedAt,
    });
    expect(replayed).toMatchObject({
      status: "submitted",
      data: { q1: "ok" },
      updatedAt: submitted.updatedAt,
    });

    const empty = await fill.startResponse({ surveyId: "pulse" });
    await expect(
      fill.submitResponse({
        id: empty.id,
        data: {},
        expectedUpdatedAt: empty.updatedAt,
      }),
    ).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.VALIDATION_FAILED.code,
      body: { questions: ["q1"] },
    });
  });
});
