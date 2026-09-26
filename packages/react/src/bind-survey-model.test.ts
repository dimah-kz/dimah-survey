import { Model } from "survey-core";
import { describe, expect, it, vi } from "vitest";

import { bindSurveyModel } from "./bind-survey-model";

const definition = {
  pages: [{ name: "p", elements: [{ type: "text", name: "q1" }] }],
};

function model() {
  const survey = new Model(definition);
  survey.data = { q1: "Ada" };
  return survey;
}

describe("bindSurveyModel", () => {
  it("stays on the survey when submit fails", async () => {
    const survey = model();
    let calls = 0;
    bindSurveyModel(survey, {
      savePartial: async () => undefined,
      submit: async () => {
        calls += 1;
        throw new Error("Survey result is invalid.");
      },
    });
    survey.doComplete();
    await vi.waitFor(() => expect(calls).toBe(1));
    expect(survey.state).not.toBe("completed");
  });

  it("completes after the server accepts the result", async () => {
    const survey = model();
    bindSurveyModel(survey, {
      savePartial: async () => undefined,
      submit: async () => undefined,
    });
    survey.doComplete();
    await vi.waitFor(() => expect(survey.state).toBe("completed"));
  });
});
