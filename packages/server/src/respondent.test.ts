import {
  SURVEY_ERROR_CODES,
  createEditorClient,
  createFillClient,
} from "@dimah-survey/core";
import { describe, expect, it } from "vitest";

import { dimahSurvey } from "./dimah-survey";
import { memoryAdapter } from "./memory";
import { guardAnonymous, guardRespondent } from "./respondent";

const definition = {
  title: "v1",
  pages: [{ name: "p", elements: [{ type: "text", name: "q1" }] }],
};

function session(respondentId: string) {
  const database = memoryAdapter();
  const editor = dimahSurvey({
    audience: "editor",
    database,
    basePath: "/api/editor",
  });
  const fill = dimahSurvey({
    audience: "fill",
    database,
    basePath: "/api/fill",
    validateResult: () => undefined,
    guard: (context) => guardRespondent(respondentId)(context),
  });
  const other = dimahSurvey({
    audience: "fill",
    database,
    basePath: "/api/fill",
    validateResult: () => undefined,
    guard: (context) => guardRespondent("user-2")(context),
  });
  const fetchFor =
    (survey: { handler: (request: Request) => Promise<Response> }) =>
    (input: RequestInfo | URL, init?: RequestInit) =>
      survey.handler(new Request(input, init));
  return {
    admin: createEditorClient({
      baseURL: "http://survey.local/api/editor",
      fetch: fetchFor(editor),
    }),
    fill: createFillClient({
      baseURL: "http://survey.local/api/fill",
      fetch: fetchFor(fill),
    }),
    user2: createFillClient({
      baseURL: "http://survey.local/api/fill",
      fetch: fetchFor(other),
    }),
    fillHandler: fill.handler,
  };
}

async function publish(admin: ReturnType<typeof session>["admin"]) {
  await admin.saveSurvey({ id: "pulse", draftJson: definition });
  await admin.publishSurvey({ id: "pulse" });
}

describe("respondent guard", () => {
  it("stamps the session onto start and refuses another respondent", async () => {
    const { admin, fill, user2 } = session("user-1");
    await publish(admin);
    const other = await user2.startResponse({ surveyId: "pulse" });
    expect(other.respondentId).toBe("user-2");

    const started = await fill.startResponse({ surveyId: "pulse" });
    expect(started.respondentId).toBe("user-1");

    await expect(
      fill.startResponse({ surveyId: "pulse", respondentId: "user-2" }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });

    const resumed = await fill.startResponse({ surveyId: "pulse" });
    expect(resumed.id).toBe(started.id);

    await expect(fill.getResponse(other.id)).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.FORBIDDEN.code,
    });
    await expect(
      fill.savePartial({ id: other.id, data: { q1: "no" } }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });
    expect((await admin.getResponse(other.id)).data).toEqual({});
  });

  it("lists only that respondent and refuses the analytics read", async () => {
    const { admin, fill, user2 } = session("user-1");
    await publish(admin);
    await fill.startResponse({ surveyId: "pulse" });
    await user2.startResponse({ surveyId: "pulse" });

    const listed = await fill.listResponses();
    expect(listed.total).toBe(1);
    expect(listed.responses).toEqual([
      expect.objectContaining({ respondentId: "user-1" }),
    ]);
    expect(listed.responses[0]).not.toHaveProperty("data");

    await expect(
      fill.listResponses({ respondentId: "user-2" }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });
    await expect(fill.listResponses({ include: "full" })).rejects.toMatchObject(
      { code: SURVEY_ERROR_CODES.FORBIDDEN.code },
    );

    const analytics = await admin.listResponses({ include: "full" });
    expect(analytics.total).toBe(2);
    expect(analytics.responses[0]).toHaveProperty("definition");
  });

  it("has no editor routes on the fill handler", async () => {
    const { fillHandler, admin } = session("user-1");
    await publish(admin);
    const response = await fillHandler(
      new Request("http://survey.local/api/fill/survey?id=pulse"),
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: SURVEY_ERROR_CODES.NOT_FOUND.code,
    });
    expect((await admin.getSurvey("pulse")).draftJson).toEqual(definition);
  });

  it("still saves and submits the caller's own draft", async () => {
    const { admin, fill } = session("user-1");
    await publish(admin);
    const started = await fill.startResponse({ surveyId: "pulse" });
    const saved = await fill.savePartial({
      id: started.id,
      data: { q1: "Ada" },
      expectedUpdatedAt: started.updatedAt,
    });
    const submitted = await fill.submitResponse({
      id: started.id,
      expectedUpdatedAt: saved.updatedAt,
    });
    expect(submitted.status).toBe("submitted");
    expect(submitted.data).toEqual({ q1: "Ada" });
    expect(await fill.getResponse(started.id)).toMatchObject({
      definition,
      data: { q1: "Ada" },
    });
  });
});

describe("anonymous fill", () => {
  it("refuses a claimed respondent and a response list", async () => {
    const database = memoryAdapter();
    const editor = dimahSurvey({
      audience: "editor",
      database,
      basePath: "/api/editor",
    });
    const fill = dimahSurvey({
      audience: "fill",
      database,
      basePath: "/api/fill",
      validateResult: () => undefined,
      guard: (context) => guardAnonymous()(context),
    });
    const admin = createEditorClient({
      baseURL: "http://survey.local/api/editor",
      fetch: (input, init) => editor.handler(new Request(input, init)),
    });
    const client = createFillClient({
      baseURL: "http://survey.local/api/fill",
      fetch: (input, init) => fill.handler(new Request(input, init)),
    });
    await admin.saveSurvey({ id: "pulse", draftJson: definition });
    await admin.publishSurvey({ id: "pulse" });
    await expect(
      client.startResponse({ surveyId: "pulse", respondentId: "user-1" }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });
    const started = await client.startResponse({ surveyId: "pulse" });
    expect(started.respondentId).toBeNull();
    await expect(client.listResponses()).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.FORBIDDEN.code,
    });
    expect(await client.getResponse(started.id)).toMatchObject({
      id: started.id,
    });
  });
});
