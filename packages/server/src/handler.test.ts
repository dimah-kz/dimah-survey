import {
  APIError,
  SURVEY_ERROR_CODES,
  type SurveyJson,
} from "@dimah-survey/core";
import { describe, expect, it, vi } from "vitest";

import { dimahSurvey } from "./dimah-survey";
import { memoryAdapter } from "./memory";
import { createSession, publishSurvey, textSurvey } from "./test/session";

const choiceSurvey = {
  pages: [
    {
      name: "p",
      elements: [
        { type: "text", name: "q1" },
        { type: "radiogroup", name: "q2", choices: ["a", "b"] },
        {
          type: "dropdown",
          name: "country",
          choicesByUrl: { url: "https://example.invalid/countries" },
        },
      ],
    },
  ],
} satisfies SurveyJson;

describe("handler", () => {
  it("validates the definition the response started with", async () => {
    const seen: unknown[] = [];
    const draft: SurveyJson = {
      title: "v1",
      pages: [{ name: "p", elements: [{ type: "text", name: "q1" }] }],
    };
    const { editor, fill } = createSession({
      validateResult: ({ definition }) => {
        seen.push(definition.title);
      },
    });
    await editor.saveSurvey({ id: "onboarding", draftJson: draft });
    await editor.publishSurvey({ id: "onboarding" });
    draft.title = "mutated-by-caller";

    const started = await fill.startResponse({ surveyId: "onboarding" });
    await fill.submitResponse({
      id: started.id,
      expectedUpdatedAt: started.updatedAt,
    });
    expect(seen).toEqual(["v1"]);
    expect((await fill.getResponse(started.id)).definition).toEqual({
      title: "v1",
      pages: [{ name: "p", elements: [{ type: "text", name: "q1" }] }],
    });
  });

  it("runs the consumer guard before the store", async () => {
    const seen: { operation?: string; id?: string }[] = [];
    const survey = dimahSurvey({
      audience: "editor",
      database: memoryAdapter(),
      guard: (context) => {
        const body = context.body as { id?: string } | undefined;
        seen.push({ operation: context.operation, id: body?.id });
        if (context.operation === "saveSurvey") {
          throw APIError.from("FORBIDDEN", SURVEY_ERROR_CODES.FORBIDDEN);
        }
      },
    });
    await expect(
      survey.api.saveSurvey({ body: { id: "x", draftJson: textSurvey } }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });
    expect(seen).toEqual([{ operation: "saveSurvey", id: "x" }]);
    await expect(
      survey.api.getSurvey({ query: { id: "x" } }),
    ).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.SURVEY_NOT_FOUND.code,
    });
  });

  it("returns the stored row when a cleaned resubmit matches", async () => {
    const seen: string[] = [];
    const { editor, fill } = createSession({
      validateResult: ({ data }) => {
        const next = { ...data };
        delete next.extra;
        return next;
      },
      fillHooks: {
        onSubmit: () => {
          seen.push("before");
        },
        afterSubmit: () => {
          seen.push("after");
        },
      },
    });
    await publishSurvey(editor);
    const started = await fill.startResponse({ surveyId: "pulse" });
    const submitted = await fill.submitResponse({
      id: started.id,
      data: { q1: "yes", extra: true },
      expectedUpdatedAt: started.updatedAt,
    });
    const replayed = await fill.submitResponse({
      id: started.id,
      data: { extra: true, q1: "yes" },
      expectedUpdatedAt: started.updatedAt,
    });
    expect(replayed).toMatchObject({
      id: submitted.id,
      status: "submitted",
      data: { q1: "yes" },
      updatedAt: submitted.updatedAt,
    });
    expect(seen).toEqual(["before", "after"]);
    await expect(
      fill.submitResponse({ id: started.id, data: { q1: "no" } }),
    ).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.RESPONSE_CLOSED.code,
    });
  });

  it("does not persist when onSubmit throws", async () => {
    const { editor, fill } = createSession({
      validateResult: () => undefined,
      fillHooks: {
        onSubmit: () => {
          throw APIError.from("FORBIDDEN", SURVEY_ERROR_CODES.FORBIDDEN);
        },
      },
    });
    await publishSurvey(editor);
    const started = await fill.startResponse({ surveyId: "pulse" });
    await expect(
      fill.submitResponse({
        id: started.id,
        expectedUpdatedAt: started.updatedAt,
      }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });
    expect((await fill.getResponse(started.id)).status).toBe("draft");
  });

  it("leaves the submitted row when afterSubmit throws", async () => {
    const { editor, fill } = createSession({
      validateResult: () => undefined,
      fillHooks: {
        afterSubmit: () => {
          throw new Error("notify failed");
        },
      },
    });
    await publishSurvey(editor);
    const started = await fill.startResponse({ surveyId: "pulse" });
    await expect(
      fill.submitResponse({
        id: started.id,
        data: { q1: "yes" },
        expectedUpdatedAt: started.updatedAt,
      }),
    ).rejects.toMatchObject({
      message: "Internal server error",
    });
    expect(await fill.getResponse(started.id)).toMatchObject({
      status: "submitted",
      data: { q1: "yes" },
    });
  });

  it("runs onSubmit once when two submits overlap", async () => {
    let calls = 0;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { editor, fill } = createSession({
      validateResult: () => undefined,
      fillHooks: {
        onSubmit: async () => {
          calls += 1;
          await gate;
        },
      },
    });
    await publishSurvey(editor);
    const started = await fill.startResponse({ surveyId: "pulse" });
    const body = {
      id: started.id,
      data: { q1: "yes" },
      expectedUpdatedAt: started.updatedAt,
    };
    const pending = Promise.all([
      fill.submitResponse(body),
      fill.submitResponse(body),
    ]);
    await vi.waitFor(() => expect(calls).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(calls).toBe(1);
    release();
    const [first, second] = await pending;
    expect(calls).toBe(1);
    expect(first.status).toBe("submitted");
    expect(second).toMatchObject({
      id: first.id,
      status: "submitted",
      data: first.data,
    });
  });

  it("runs start hooks only when a row is inserted", async () => {
    const seen: string[] = [];
    const { editor, fill } = createSession({
      respondentId: "user-1",
      validateResult: () => undefined,
      fillHooks: {
        onStart: () => {
          seen.push("onStart");
        },
        afterStart: () => {
          seen.push("afterStart");
        },
      },
    });
    await publishSurvey(editor);
    await fill.startResponse({ surveyId: "pulse" });
    await fill.startResponse({ surveyId: "pulse" });
    expect(seen).toEqual(["onStart", "afterStart"]);
  });

  it("does not publish when onPublish throws", async () => {
    const { editor } = createSession({
      editorHooks: {
        onPublish: () => {
          throw APIError.from("FORBIDDEN", SURVEY_ERROR_CODES.FORBIDDEN);
        },
      },
    });
    await editor.saveSurvey({ id: "pulse", draftJson: textSurvey });
    await expect(editor.publishSurvey({ id: "pulse" })).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.FORBIDDEN.code,
    });
    const survey = await editor.getSurvey("pulse");
    expect(survey.status).toBe("draft");
    expect(survey.publishedJson).toBeNull();
  });

  it("serves the published document without the editor draft", async () => {
    const { editor, fill, respondent } = createSession();
    await editor.saveSurvey({
      id: "pulse",
      slug: "pulse",
      draftJson: textSurvey,
    });
    await expect(fill.getPublishedSurvey("pulse")).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.SURVEY_NOT_FOUND.code,
    });
    await editor.publishSurvey({ id: "pulse" });
    await editor.saveSurvey({
      id: "pulse",
      draftJson: { title: "secret", pages: [] },
    });
    const published = await fill.getPublishedSurvey("pulse");
    expect(published.publishedJson).toEqual(textSurvey);
    expect(published).not.toHaveProperty("draftJson");
    expect(published.settings.responses).toBe("one-open");
    const asUser = await respondent("user-1").getPublishedSurvey("pulse");
    expect(asUser).toEqual(published);
  });

  it("clears partial data by default and can keep the payload", async () => {
    const cleared = createSession();
    await publishSurvey(cleared.editor, { draftJson: choiceSurvey });
    const started = await cleared.fill.startResponse({ surveyId: "pulse" });
    const saved = await cleared.fill.savePartial({
      id: started.id,
      data: { q1: "ok", q2: "nope", country: "fr", extra: 1 },
      expectedUpdatedAt: started.updatedAt,
    });
    expect(saved.data).toEqual({ q1: "ok", country: "fr" });

    const replaced = createSession({ sanitizePartial: "replace" });
    await publishSurvey(replaced.editor, { draftJson: choiceSurvey });
    const open = await replaced.fill.startResponse({ surveyId: "pulse" });
    const raw = await replaced.fill.savePartial({
      id: open.id,
      data: { q1: "ok", extra: 1 },
      expectedUpdatedAt: open.updatedAt,
    });
    expect(raw.data).toEqual({ q1: "ok", extra: 1 });
  });

  it("pages surveys and response summaries", async () => {
    const { editor, fill } = createSession({ respondentId: "user-1" });
    await editor.saveSurvey({ id: "a", slug: "pulse", draftJson: textSurvey });
    await editor.publishSurvey({ id: "a" });
    await editor.saveSurvey({ id: "b", draftJson: { title: "v2", pages: [] } });
    const started = await fill.startResponse({ surveyId: "a" });
    await fill.submitResponse({
      id: started.id,
      data: { q1: "yes" },
      expectedUpdatedAt: started.updatedAt,
    });

    const surveys = await editor.listSurveys({ limit: 1 });
    expect(surveys.surveys).toHaveLength(1);
    expect(surveys.limit).toBe(1);
    expect(surveys.nextOffset).toBe(1);

    const listed = await editor.listResponses({ surveyId: "pulse" });
    expect(listed.total).toBe(1);
    expect(listed.responses[0]).toMatchObject({
      id: started.id,
      status: "submitted",
    });
    expect(listed.responses[0]).not.toHaveProperty("definition");
    expect(listed.responses[0]).not.toHaveProperty("data");

    const full = await editor.listResponses({ surveyId: "a", include: "full" });
    expect(full.responses[0]).toMatchObject({
      definition: textSurvey,
      data: { q1: "yes" },
    });
    const unknown = await editor.listResponses({ surveyId: "missing" });
    expect(unknown).toMatchObject({
      responses: [],
      total: 0,
      nextOffset: null,
    });
  });

  it("reports a missing editor record as not found", async () => {
    const { editor } = createSession();
    await expect(editor.getSurvey("missing")).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.SURVEY_NOT_FOUND.code,
    });
    await expect(editor.getResponse("missing")).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.RESPONSE_NOT_FOUND.code,
    });
  });
});
