import {
  APIError,
  SURVEY_ERROR_CODES,
  createEditorClient,
  createFillClient,
  type EditorClient,
  type ValidateResult,
} from "@dimah-survey/core";
import { describe, expect, it, vi } from "vitest";

import { dimahSurvey, type FillHooks } from "./dimah-survey";
import { memoryAdapter } from "./memory";
import { guardAnonymous, guardRespondent } from "./respondent";

const v1 = {
  title: "v1",
  pages: [{ name: "p", elements: [{ type: "text", name: "q1" }] }],
};
const v2 = { title: "v2", pages: [] };

function mount(options?: {
  respondentId?: string;
  hooks?: FillHooks;
  validateResult?: ValidateResult;
  database?: ReturnType<typeof memoryAdapter>;
}) {
  const database = options?.database ?? memoryAdapter();
  const validateResult = options?.validateResult ?? (() => undefined);
  const hooks = options?.hooks;
  const editorSurvey = dimahSurvey({
    audience: "editor",
    database,
    basePath: "/api/editor",
  });
  const fillSurvey = dimahSurvey({
    audience: "fill",
    database,
    validateResult,
    hooks,
    basePath: "/api/fill",
    guard: (context) =>
      options?.respondentId
        ? guardRespondent(options.respondentId)(context)
        : guardAnonymous()(context),
  });
  const fetchFor =
    (survey: { handler: (request: Request) => Promise<Response> }) =>
    (input: RequestInfo | URL, init?: RequestInit) =>
      survey.handler(new Request(input, init));
  const editor = createEditorClient({
    baseURL: "http://survey.local/api/editor",
    fetch: fetchFor(editorSurvey),
  });
  const fill = createFillClient({
    baseURL: "http://survey.local/api/fill",
    fetch: fetchFor(fillSurvey),
  });
  return { editor, fill, database };
}

async function publish(editor: EditorClient, id: string, draftJson = v1) {
  await editor.saveSurvey({ id, draftJson });
  await editor.publishSurvey({ id });
}

describe("published snapshot", () => {
  it("keeps the definition a response started with", async () => {
    const seen: { title: unknown }[] = [];
    const { editor, fill } = mount({
      validateResult: ({ definition }) => {
        seen.push({ title: definition.title });
      },
    });
    const draft = { ...v1 };
    await editor.saveSurvey({ id: "onboarding", draftJson: draft });
    await editor.publishSurvey({ id: "onboarding" });
    draft.title = "mutated-by-caller";

    const started = await fill.startResponse({ surveyId: "onboarding" });
    expect(started.definition).toEqual(v1);

    const saved = await fill.savePartial({
      id: started.id,
      data: { q1: "a" },
      expectedUpdatedAt: started.updatedAt,
    });
    const submitted = await fill.submitResponse({
      id: started.id,
      expectedUpdatedAt: saved.updatedAt,
    });
    expect(submitted.status).toBe("submitted");
    expect(submitted.definition).toEqual(v1);
    expect(seen).toEqual([{ title: "v1" }]);

    const edited = await editor.saveSurvey({
      id: "onboarding",
      draftJson: v2,
    });
    await editor.publishSurvey({
      id: "onboarding",
      expectedUpdatedAt: edited.updatedAt,
    });

    const again = await fill.getResponse(started.id);
    expect(again.definition).toEqual(v1);
    const next = await fill.startResponse({ surveyId: "onboarding" });
    expect(next.id).not.toBe(started.id);
    expect(next.definition).toEqual(v2);
  });

  it("rejects a stale partial save", async () => {
    const { editor, fill } = mount();
    await publish(editor, "pulse");
    const started = await fill.startResponse({ surveyId: "pulse" });
    await expect(
      fill.savePartial({
        id: started.id,
        data: { q1: "a" },
        expectedUpdatedAt: "2000-01-01T00:00:00.000Z",
      }),
    ).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.STALE_UPDATE.code,
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
      survey.api.saveSurvey({ body: { id: "x", draftJson: v1 } }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });
    expect(seen).toEqual([{ operation: "saveSurvey", id: "x" }]);
  });
});

describe("one open draft", () => {
  it("returns the open draft for the same respondent", async () => {
    const database = memoryAdapter();
    const { editor, fill } = mount({ respondentId: "user-1", database });
    const other = dimahSurvey({
      audience: "fill",
      database,
      basePath: "/api/fill",
      validateResult: () => undefined,
      guard: (context) => guardRespondent("user-2")(context),
    });
    const user2 = createFillClient({
      baseURL: "http://survey.local/api/fill",
      fetch: (input, init) => other.handler(new Request(input, init)),
    });
    await publish(editor, "onboarding");
    const first = await fill.startResponse({ surveyId: "onboarding" });
    await fill.savePartial({
      id: first.id,
      data: { q1: "Ada" },
      expectedUpdatedAt: first.updatedAt,
    });

    const resumed = await fill.startResponse({ surveyId: "onboarding" });
    expect(resumed.id).toBe(first.id);
    expect(resumed.data).toEqual({ q1: "Ada" });
    expect(resumed.respondentId).toBe("user-1");

    const edited = await editor.saveSurvey({
      id: "onboarding",
      draftJson: v2,
    });
    await editor.publishSurvey({
      id: "onboarding",
      expectedUpdatedAt: edited.updatedAt,
    });
    const still = await fill.startResponse({ surveyId: "onboarding" });
    expect(still.id).toBe(first.id);
    expect(still.definition).toEqual(v1);

    const second = await user2.startResponse({ surveyId: "onboarding" });
    expect(second.id).not.toBe(first.id);
    expect(second.definition).toEqual(v2);
  });

  it("opens a new anonymous response on every start", async () => {
    const { editor, fill } = mount();
    await publish(editor, "onboarding");
    const first = await fill.startResponse({ surveyId: "onboarding" });
    const second = await fill.startResponse({ surveyId: "onboarding" });
    expect(second.id).not.toBe(first.id);
    expect(first.respondentId).toBeNull();
  });

  it("collapses concurrent starts for one respondent", async () => {
    const { editor, fill } = mount({ respondentId: "user-1" });
    await publish(editor, "onboarding");
    const [first, second] = await Promise.all([
      fill.startResponse({ surveyId: "onboarding" }),
      fill.startResponse({ surveyId: "onboarding" }),
    ]);
    expect(first.id).toBe(second.id);
  });

  it("rejects reopen while another draft is open", async () => {
    const { editor, fill } = mount({ respondentId: "user-1" });
    await publish(editor, "onboarding");
    const first = await fill.startResponse({ surveyId: "onboarding" });
    const submitted = await fill.submitResponse({
      id: first.id,
      data: { q1: "yes" },
      expectedUpdatedAt: first.updatedAt,
    });
    const next = await fill.startResponse({ surveyId: "onboarding" });
    expect(next.id).not.toBe(first.id);
    await expect(
      fill.reopenResponse({
        id: submitted.id,
        expectedUpdatedAt: submitted.updatedAt,
      }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.OPEN_DRAFT.code });
    expect((await fill.getResponse(submitted.id)).status).toBe("submitted");
  });

  it("reopen becomes the open draft when none exists", async () => {
    const { editor, fill } = mount({ respondentId: "user-1" });
    await publish(editor, "onboarding");
    const first = await fill.startResponse({ surveyId: "onboarding" });
    const abandoned = await fill.abandonResponse({
      id: first.id,
      expectedUpdatedAt: first.updatedAt,
    });
    const reopened = await fill.reopenResponse({
      id: abandoned.id,
      expectedUpdatedAt: abandoned.updatedAt,
    });
    expect(reopened.status).toBe("draft");
    expect(reopened.definition).toEqual(v1);
    const resumed = await fill.startResponse({ surveyId: "onboarding" });
    expect(resumed.id).toBe(first.id);
  });
});

describe("idempotent submit", () => {
  it("returns the stored row when the cleaned payload matches", async () => {
    const seen: string[] = [];
    const { editor, fill } = mount({
      validateResult: ({ data }) => {
        const next = { ...data };
        delete next.extra;
        return next;
      },
      hooks: {
        onSubmit: () => {
          seen.push("before");
        },
        afterSubmit: () => {
          seen.push("after");
        },
      },
    });
    await publish(editor, "pulse");
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
      fill.submitResponse({
        id: started.id,
        data: { q1: "no" },
      }),
    ).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.RESPONSE_CLOSED.code,
    });
  });

  it("does not persist when onSubmit throws", async () => {
    const { editor, fill } = mount({
      validateResult: () => undefined,
      hooks: {
        onSubmit: () => {
          throw APIError.from("FORBIDDEN", SURVEY_ERROR_CODES.FORBIDDEN);
        },
      },
    });
    await publish(editor, "pulse");
    const started = await fill.startResponse({ surveyId: "pulse" });
    await expect(
      fill.submitResponse({
        id: started.id,
        expectedUpdatedAt: started.updatedAt,
      }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });
    expect((await fill.getResponse(started.id)).status).toBe("draft");
  });

  it("runs onSubmit once when two submits overlap", async () => {
    let calls = 0;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const { editor, fill } = mount({
      validateResult: () => undefined,
      hooks: {
        onSubmit: async () => {
          calls += 1;
          await gate;
        },
      },
    });
    await publish(editor, "pulse");
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
});

describe("list", () => {
  it("pages surveys and response summaries", async () => {
    const { editor, fill } = mount({ respondentId: "user-1" });
    await editor.saveSurvey({ id: "a", slug: "pulse", draftJson: v1 });
    await editor.publishSurvey({ id: "a" });
    await editor.saveSurvey({ id: "b", draftJson: v2 });
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

    const full = await editor.listResponses({
      surveyId: "a",
      include: "full",
    });
    expect(full.responses[0]).toMatchObject({
      definition: v1,
      data: { q1: "yes" },
    });
  });
});

describe("slug", () => {
  it("keeps the previous slug when the next one is taken", async () => {
    const { editor } = mount();
    await editor.saveSurvey({ id: "a", slug: "one", draftJson: v1 });
    await editor.saveSurvey({ id: "b", slug: "two", draftJson: v1 });
    await expect(
      editor.saveSurvey({ id: "a", slug: "two", draftJson: v2 }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SLUG_TAKEN.code });

    const survey = await editor.getSurvey("one");
    expect(survey.id).toBe("a");
    expect(survey.draftJson).toEqual(v1);
  });

  it("rejects a slug that is another survey's id", async () => {
    const { editor } = mount();
    await editor.saveSurvey({ id: "pulse", draftJson: v1 });
    await editor.saveSurvey({ id: "other", slug: "kept", draftJson: v1 });
    await expect(
      editor.saveSurvey({ id: "other", slug: "pulse", draftJson: v2 }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SLUG_TAKEN.code });
    expect((await editor.getSurvey("kept")).id).toBe("other");
    expect((await editor.getSurvey("pulse")).draftJson).toEqual(v1);
  });
});
