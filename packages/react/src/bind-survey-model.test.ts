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
    const onWriteError = vi.fn();
    let calls = 0;
    bindSurveyModel(survey, {
      savePartial: async () => undefined,
      submit: async () => {
        calls += 1;
        throw new Error("Survey result is invalid.");
      },
      onWriteError,
    });
    survey.doComplete();
    await vi.waitFor(() => expect(calls).toBe(1));
    expect(survey.state).not.toBe("completed");
    expect(onWriteError).toHaveBeenCalledOnce();
  });

  it("reports a partial save failure and leaves the model in place", async () => {
    const survey = new Model({
      pages: [
        { name: "p1", elements: [{ type: "text", name: "q1" }] },
        { name: "p2", elements: [{ type: "text", name: "q2" }] },
      ],
    });
    survey.data = { q1: "Ada" };
    const onWriteError = vi.fn();
    bindSurveyModel(survey, {
      savePartial: async () => {
        throw new Error("offline");
      },
      submit: async () => undefined,
      onWriteError,
    });
    survey.nextPage();
    await vi.waitFor(() => expect(onWriteError).toHaveBeenCalledOnce());
    expect(survey.state).not.toBe("completed");
    expect(survey.data).toEqual({ q1: "Ada" });
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
