import {
  APIError,
  SURVEY_ERROR_CODES,
  createSurveyClient,
} from "@dimah-survey/core";
import { describe, expect, it } from "vitest";

import { dimahSurvey } from "./dimah-survey";
import { memoryAdapter } from "./memory";

const v1 = { title: "v1", pages: [{ name: "p" }] };
const v2 = { title: "v2", pages: [] };

function instance() {
  const seen: { title: unknown }[] = [];
  const survey = dimahSurvey({
    database: memoryAdapter(),
    validateResult: ({ definition }) => {
      seen.push({ title: definition.title });
    },
  });
  const client = createSurveyClient({
    baseURL: "http://survey.local/api/survey",
    fetch: (input, init) => survey.handler(new Request(input, init)),
  });
  return { client, seen };
}

describe("published snapshot", () => {
  it("keeps the definition a response started with", async () => {
    const { client, seen } = instance();
    const draft = { ...v1 };
    await client.saveSurvey({ id: "onboarding", draftJson: draft });
    await client.publishSurvey({ id: "onboarding" });
    draft.title = "mutated-by-caller";

    const started = await client.startResponse({ surveyId: "onboarding" });
    expect(started.definition).toEqual(v1);

    const saved = await client.savePartial({
      id: started.id,
      data: { q1: "a" },
      expectedUpdatedAt: started.updatedAt,
    });
    const submitted = await client.submitResponse({
      id: started.id,
      expectedUpdatedAt: saved.updatedAt,
    });
    expect(submitted.status).toBe("submitted");
    expect(submitted.definition).toEqual(v1);
    expect(seen).toEqual([{ title: "v1" }]);

    const edited = await client.saveSurvey({
      id: "onboarding",
      draftJson: v2,
    });
    await client.publishSurvey({
      id: "onboarding",
      expectedUpdatedAt: edited.updatedAt,
    });

    const again = await client.getResponse(started.id);
    expect(again.definition).toEqual(v1);
    const next = await client.startResponse({ surveyId: "onboarding" });
    expect(next.definition).toEqual(v2);
  });

  it("rejects a stale partial save", async () => {
    const { client } = instance();
    await client.saveSurvey({ id: "pulse", draftJson: v1 });
    await client.publishSurvey({ id: "pulse" });
    const started = await client.startResponse({ surveyId: "pulse" });
    await expect(
      client.savePartial({
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
      database: memoryAdapter(),
      validateResult: () => undefined,
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

describe("list and resume", () => {
  it("pages surveys and response summaries", async () => {
    const { client } = instance();
    await client.saveSurvey({ id: "a", slug: "pulse", draftJson: v1 });
    await client.publishSurvey({ id: "a" });
    await client.saveSurvey({ id: "b", draftJson: v2 });
    const started = await client.startResponse({
      surveyId: "a",
      respondentId: "user-1",
    });
    await client.submitResponse({
      id: started.id,
      data: { q1: "yes" },
      expectedUpdatedAt: started.updatedAt,
    });

    const surveys = await client.listSurveys({ limit: 1 });
    expect(surveys.surveys).toHaveLength(1);
    expect(surveys.limit).toBe(1);
    expect(surveys.nextOffset).toBe(1);

    const listed = await client.listResponses({ surveyId: "pulse" });
    expect(listed.total).toBe(1);
    expect(listed.responses[0]).toMatchObject({
      id: started.id,
      status: "submitted",
    });
    expect(listed.responses[0]).not.toHaveProperty("definition");
    expect(listed.responses[0]).not.toHaveProperty("data");

    const full = await client.listResponses({
      surveyId: "a",
      include: "full",
    });
    expect(full.responses[0]).toMatchObject({
      definition: v1,
      data: { q1: "yes" },
    });
  });

  it("resumes the latest draft for the same respondent", async () => {
    const { client } = instance();
    await client.saveSurvey({ id: "onboarding", draftJson: v1 });
    await client.publishSurvey({ id: "onboarding" });
    const first = await client.startResponse({
      surveyId: "onboarding",
      respondentId: "user-1",
    });
    await client.savePartial({
      id: first.id,
      data: { q1: "Ada" },
      expectedUpdatedAt: first.updatedAt,
    });

    const resumed = await client.startResponse({
      surveyId: "onboarding",
      respondentId: "user-1",
      resume: true,
    });
    expect(resumed.id).toBe(first.id);
    expect(resumed.data).toEqual({ q1: "Ada" });

    const other = await client.startResponse({
      surveyId: "onboarding",
      respondentId: "user-2",
      resume: true,
    });
    expect(other.id).not.toBe(first.id);
  });

  it("rejects resume without respondentId", async () => {
    const { client } = instance();
    await client.saveSurvey({ id: "onboarding", draftJson: v1 });
    await client.publishSurvey({ id: "onboarding" });
    await expect(
      client.startResponse({ surveyId: "onboarding", resume: true }),
    ).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.RESUME_REQUIRES_RESPONDENT.code,
    });
  });

  it("runs onSubmit before persist and afterSubmit after", async () => {
    const seen: string[] = [];
    const survey = dimahSurvey({
      database: memoryAdapter(),
      validateResult: () => undefined,
      hooks: {
        onSubmit: ({ response }) => {
          seen.push(`before:${response.status}`);
        },
        afterSubmit: ({ response }) => {
          seen.push(`after:${response.status}`);
        },
      },
    });
    const client = createSurveyClient({
      baseURL: "http://survey.local/api/survey",
      fetch: (input, init) => survey.handler(new Request(input, init)),
    });
    await client.saveSurvey({ id: "pulse", draftJson: v1 });
    await client.publishSurvey({ id: "pulse" });
    const started = await client.startResponse({ surveyId: "pulse" });
    await client.submitResponse({
      id: started.id,
      expectedUpdatedAt: started.updatedAt,
    });
    expect(seen).toEqual(["before:draft", "after:submitted"]);
  });

  it("does not persist when onSubmit throws", async () => {
    const survey = dimahSurvey({
      database: memoryAdapter(),
      validateResult: () => undefined,
      hooks: {
        onSubmit: () => {
          throw APIError.from("FORBIDDEN", SURVEY_ERROR_CODES.FORBIDDEN);
        },
      },
    });
    const client = createSurveyClient({
      baseURL: "http://survey.local/api/survey",
      fetch: (input, init) => survey.handler(new Request(input, init)),
    });
    await client.saveSurvey({ id: "pulse", draftJson: v1 });
    await client.publishSurvey({ id: "pulse" });
    const started = await client.startResponse({ surveyId: "pulse" });
    await expect(
      client.submitResponse({
        id: started.id,
        expectedUpdatedAt: started.updatedAt,
      }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });
    const current = await client.getResponse(started.id);
    expect(current.status).toBe("draft");
  });
});

describe("slug", () => {
  it("keeps the previous slug when the next one is taken", async () => {
    const { client } = instance();
    await client.saveSurvey({ id: "a", slug: "one", draftJson: v1 });
    await client.saveSurvey({ id: "b", slug: "two", draftJson: v1 });
    await expect(
      client.saveSurvey({ id: "a", slug: "two", draftJson: v2 }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SLUG_TAKEN.code });

    const survey = await client.getSurvey("one");
    expect(survey.id).toBe("a");
    expect(survey.draftJson).toEqual(v1);
  });

  it("rejects a slug that is another survey's id", async () => {
    const { client } = instance();
    await client.saveSurvey({ id: "pulse", draftJson: v1 });
    await client.saveSurvey({ id: "other", slug: "kept", draftJson: v1 });
    await expect(
      client.saveSurvey({ id: "other", slug: "pulse", draftJson: v2 }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SLUG_TAKEN.code });
    expect((await client.getSurvey("kept")).id).toBe("other");
    expect((await client.getSurvey("pulse")).draftJson).toEqual(v1);
  });
});
