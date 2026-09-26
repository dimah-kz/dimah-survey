import {
  APIError,
  DEFAULT_SURVEY_SETTINGS,
  SURVEY_ERROR_CODES,
  createEditorClient,
  createFillClient,
  type SurveyJson,
  type SurveySettings,
} from "@dimah-survey/core";
import { describe, expect, it } from "vitest";

import {
  dimahSurvey,
  type EditorHooks,
  type FillHooks,
  type SanitizePartial,
} from "./dimah-survey";
import { memoryAdapter } from "./memory";
import { guardAnonymous, guardRespondent } from "./respondent";

const definition = {
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
};

function session(options?: {
  respondentId?: string;
  fillHooks?: FillHooks;
  editorHooks?: EditorHooks;
  sanitizePartial?: SanitizePartial;
  anonymous?: boolean;
}) {
  const database = memoryAdapter();
  const editorSurvey = dimahSurvey({
    audience: "editor",
    database,
    basePath: "/api/editor",
    hooks: options?.editorHooks,
  });
  const fillSurvey = dimahSurvey({
    audience: "fill",
    database,
    basePath: "/api/fill",
    hooks: options?.fillHooks,
    sanitizePartial: options?.sanitizePartial,
    guard: (context) => {
      if (options?.anonymous || !options?.respondentId) {
        return guardAnonymous()(context);
      }
      return guardRespondent(options.respondentId)(context);
    },
  });
  const fetchFor =
    (survey: { handler: (request: Request) => Promise<Response> }) =>
    (input: RequestInfo | URL, init?: RequestInit) =>
      survey.handler(new Request(input, init));
  return {
    database,
    editor: createEditorClient({
      baseURL: "http://survey.local/api/editor",
      fetch: fetchFor(editorSurvey),
    }),
    fill: createFillClient({
      baseURL: "http://survey.local/api/fill",
      fetch: fetchFor(fillSurvey),
    }),
    fillHandler: fillSurvey.handler,
    respondent(respondentId: string) {
      const other = dimahSurvey({
        audience: "fill",
        database,
        basePath: "/api/fill",
        sanitizePartial: options?.sanitizePartial,
        guard: (context) => guardRespondent(respondentId)(context),
      });
      return createFillClient({
        baseURL: "http://survey.local/api/fill",
        fetch: fetchFor(other),
      });
    },
  };
}

async function publish(
  editor: ReturnType<typeof session>["editor"],
  draftJson: SurveyJson = definition,
) {
  await editor.saveSurvey({ id: "pulse", draftJson });
  return editor.publishSurvey({ id: "pulse" });
}

function settings(patch: Partial<SurveySettings>): SurveySettings {
  return { ...DEFAULT_SURVEY_SETTINGS, ...patch };
}

describe("collection settings", () => {
  it("returns the same submitted row for a single response and inserts again for one-open", async () => {
    const started: string[] = [];
    const single = session({
      respondentId: "user-1",
      fillHooks: {
        afterStart: () => {
          started.push("after");
        },
      },
    });
    await publish(single.editor);
    await single.editor.saveSurveySettings({
      id: "pulse",
      settings: settings({ responses: "single" }),
    });
    const first = await single.fill.startResponse({ surveyId: "pulse" });
    const submitted = await single.fill.submitResponse({
      id: first.id,
      data: { q1: "once" },
      expectedUpdatedAt: first.updatedAt,
    });
    const again = await single.fill.startResponse({ surveyId: "pulse" });
    expect(again.id).toBe(submitted.id);
    expect(again.status).toBe("submitted");
    expect(started).toEqual(["after"]);

    const open = session({ respondentId: "user-1" });
    await publish(open.editor);
    const draft = await open.fill.startResponse({ surveyId: "pulse" });
    const done = await open.fill.submitResponse({
      id: draft.id,
      data: { q1: "next" },
      expectedUpdatedAt: draft.updatedAt,
    });
    const second = await open.fill.startResponse({ surveyId: "pulse" });
    expect(second.id).not.toBe(done.id);
    expect(second.status).toBe("draft");
  });

  it("closes the window for start, partial, and submit, and still abandons", async () => {
    const { editor, fill } = session();
    await publish(editor);
    const published = await fill.getPublishedSurvey("pulse");
    expect(published).not.toHaveProperty("draftJson");
    expect(published.publishedJson).toEqual(definition);

    const started = await fill.startResponse({ surveyId: "pulse" });
    await editor.saveSurveySettings({
      id: "pulse",
      settings: settings({ closesAt: "2000-01-01T00:00:00.000Z" }),
    });
    const closed = await fill.getPublishedSurvey("pulse");
    expect(closed.publishedJson).toEqual(definition);
    expect(closed.settings.closesAt).toBe("2000-01-01T00:00:00.000Z");
    await expect(
      fill.startResponse({ surveyId: "pulse" }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SURVEY_CLOSED.code });
    await expect(
      fill.savePartial({
        id: started.id,
        data: { q1: "late" },
        expectedUpdatedAt: started.updatedAt,
      }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SURVEY_CLOSED.code });
    await expect(
      fill.submitResponse({
        id: started.id,
        data: { q1: "late" },
        expectedUpdatedAt: started.updatedAt,
      }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SURVEY_CLOSED.code });
    const abandoned = await fill.abandonResponse({
      id: started.id,
      expectedUpdatedAt: started.updatedAt,
    });
    expect(abandoned.status).toBe("abandoned");
  });

  it("stops a new start and a second submit at the response cap", async () => {
    const { editor, fill, respondent } = session({ respondentId: "user-1" });
    const other = respondent("user-2");
    await publish(editor);
    await editor.saveSurveySettings({
      id: "pulse",
      settings: settings({ maxResponses: 1 }),
    });
    const first = await fill.startResponse({ surveyId: "pulse" });
    const second = await other.startResponse({ surveyId: "pulse" });
    const submitted = await fill.submitResponse({
      id: first.id,
      data: { q1: "only" },
      expectedUpdatedAt: first.updatedAt,
    });
    expect(submitted.status).toBe("submitted");
    await expect(
      other.submitResponse({
        id: second.id,
        data: { q1: "too many" },
        expectedUpdatedAt: second.updatedAt,
      }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.RESPONSE_LIMIT.code });
    const third = respondent("user-3");
    await expect(
      third.startResponse({ surveyId: "pulse" }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.RESPONSE_LIMIT.code });
  });

  it("refuses reopen when the survey disallows it", async () => {
    const { editor, fill } = session({ respondentId: "user-1" });
    await publish(editor);
    await editor.saveSurveySettings({
      id: "pulse",
      settings: settings({ reopen: false }),
    });
    const started = await fill.startResponse({ surveyId: "pulse" });
    const submitted = await fill.submitResponse({
      id: started.id,
      data: { q1: "done" },
      expectedUpdatedAt: started.updatedAt,
    });
    await expect(
      fill.reopenResponse({
        id: submitted.id,
        expectedUpdatedAt: submitted.updatedAt,
      }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.RESPONSE_CLOSED.code });
  });

  it("resumes collection without publishing the unpublished draft", async () => {
    const { editor } = session();
    const published = await publish(editor, { title: "v1", pages: [] });
    const edited = await editor.saveSurvey({
      id: "pulse",
      draftJson: { title: "v2", pages: [] },
      expectedUpdatedAt: published.updatedAt,
    });
    const archived = await editor.archiveSurvey({
      id: "pulse",
      expectedUpdatedAt: edited.updatedAt,
    });
    const resumed = await editor.resumeSurvey({
      id: "pulse",
      expectedUpdatedAt: archived.updatedAt,
    });
    expect(resumed.status).toBe("active");
    expect(resumed.publishedJson).toEqual({ title: "v1", pages: [] });
    expect(resumed.draftJson).toEqual({ title: "v2", pages: [] });
    expect(resumed.settings).toEqual(DEFAULT_SURVEY_SETTINGS);
    const again = await editor.resumeSurvey({ id: "pulse" });
    expect(again.updatedAt).toBe(resumed.updatedAt);
  });

  it("does not publish when onPublish throws", async () => {
    const { editor } = session({
      editorHooks: {
        onPublish: () => {
          throw APIError.from("FORBIDDEN", SURVEY_ERROR_CODES.FORBIDDEN);
        },
      },
    });
    await editor.saveSurvey({ id: "pulse", draftJson: definition });
    await expect(editor.publishSurvey({ id: "pulse" })).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.FORBIDDEN.code,
    });
    const survey = await editor.getSurvey("pulse");
    expect(survey.status).toBe("draft");
    expect(survey.publishedJson).toBeNull();
  });

  it("serves the published document without the editor draft", async () => {
    const { editor, fill, fillHandler } = session();
    await editor.saveSurvey({
      id: "pulse",
      slug: "pulse",
      draftJson: definition,
    });
    await editor.publishSurvey({ id: "pulse" });
    await editor.saveSurvey({
      id: "pulse",
      draftJson: { title: "secret", pages: [] },
    });
    const published = await fill.getPublishedSurvey("pulse");
    expect(published.publishedJson).toEqual(definition);
    expect(published).not.toHaveProperty("draftJson");
    const hidden = await fillHandler(
      new Request("http://survey.local/api/fill/survey?id=pulse"),
    );
    expect(hidden.status).toBe(404);
  });

  it("clears partial data by default and can keep the payload", async () => {
    const cleared = session();
    await publish(cleared.editor);
    const started = await cleared.fill.startResponse({ surveyId: "pulse" });
    const saved = await cleared.fill.savePartial({
      id: started.id,
      data: { q1: "ok", q2: "nope", country: "fr", extra: 1 },
      expectedUpdatedAt: started.updatedAt,
    });
    expect(saved.data).toEqual({ q1: "ok", country: "fr" });

    const replaced = session({ sanitizePartial: "replace" });
    await publish(replaced.editor);
    const open = await replaced.fill.startResponse({ surveyId: "pulse" });
    const raw = await replaced.fill.savePartial({
      id: open.id,
      data: { q1: "ok", extra: 1 },
      expectedUpdatedAt: open.updatedAt,
    });
    expect(raw.data).toEqual({ q1: "ok", extra: 1 });
  });
});
