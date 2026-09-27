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
    expect(survey.partialSendEnabled).toBe(true);
    expect(survey.sendResultOnPageNext).toBe(true);
    survey.nextPage();
    await vi.waitFor(() => expect(onWriteError).toHaveBeenCalledOnce());
    expect(survey.state).not.toBe("completed");
    expect(survey.data).toEqual({ q1: "Ada" });
  });

  it("does not partial-save when partial sending is off", async () => {
    const survey = new Model({
      pages: [
        { name: "p1", elements: [{ type: "text", name: "q1" }] },
        { name: "p2", elements: [{ type: "text", name: "q2" }] },
      ],
    });
    const savePartial = vi.fn(async () => undefined);
    const submit = vi.fn(async () => undefined);
    bindSurveyModel(survey, { savePartial, submit }, { partial: "off" });
    expect(survey.partialSendEnabled).toBe(false);
    expect(survey.sendResultOnPageNext).toBe(false);
    survey.nextPage();
    await Promise.resolve();
    expect(savePartial).not.toHaveBeenCalled();
    survey.doComplete();
    await vi.waitFor(() => expect(submit).toHaveBeenCalledOnce());
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

  it("stops saving after dispose", async () => {
    const survey = new Model({
      pages: [
        { name: "p1", elements: [{ type: "text", name: "q1" }] },
        { name: "p2", elements: [{ type: "text", name: "q2" }] },
      ],
    });
    const savePartial = vi.fn(async () => undefined);
    const dispose = bindSurveyModel(survey, {
      savePartial,
      submit: async () => undefined,
    });
    dispose();
    survey.nextPage();
    await Promise.resolve();
    expect(savePartial).not.toHaveBeenCalled();
  });

  it("stores file and signature answers as urls", () => {
    const survey = new Model({
      pages: [
        {
          name: "p",
          elements: [
            { type: "file", name: "upload", storeDataAsText: true },
            { type: "signaturepad", name: "sign", storeDataAsText: true },
            { type: "text", name: "q1" },
          ],
        },
      ],
    });
    const dispose = bindSurveyModel(survey, {
      savePartial: async () => undefined,
      submit: async () => undefined,
    });
    expect(survey.getQuestionByName("upload")?.storeDataAsText).toBe(false);
    expect(survey.getQuestionByName("sign")?.storeDataAsText).toBe(false);

    const page = survey.pages[0];
    if (!page) throw new Error("Missing page");
    page.addNewQuestion("file", "later");
    expect(survey.getQuestionByName("later")?.storeDataAsText).toBe(false);

    dispose();
    page.addNewQuestion("file", "after");
    expect(survey.getQuestionByName("after")?.storeDataAsText).toBe(true);
  });
});
