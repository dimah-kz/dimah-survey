import { SURVEY_ERROR_CODES, createSurveyClient } from "@dimah-survey/core";
import { describe, expect, it } from "vitest";

import { dimahSurvey } from "./dimah-survey";
import { memoryAdapter } from "./memory";
import { guardRespondent } from "./respondent";

const definition = { title: "v1", pages: [{ name: "p" }] };

function session(respondentId: string) {
  const database = memoryAdapter();
  const admin = dimahSurvey({
    database,
    validateResult: () => undefined,
  });
  const fill = dimahSurvey({
    database,
    validateResult: () => undefined,
    guard: (context) => guardRespondent(respondentId)(context),
  });
  const clientFor = (survey: ReturnType<typeof dimahSurvey>) =>
    createSurveyClient({
      baseURL: "http://survey.local/api/survey",
      fetch: (input, init) => survey.handler(new Request(input, init)),
    });
  return { admin: clientFor(admin), fill: clientFor(fill) };
}

async function publish(admin: ReturnType<typeof session>["admin"]) {
  await admin.saveSurvey({ id: "pulse", draftJson: definition });
  await admin.publishSurvey({ id: "pulse" });
}

describe("respondent guard", () => {
  it("stamps the session onto start and refuses another respondent", async () => {
    const { admin, fill } = session("user-1");
    await publish(admin);
    const other = await admin.startResponse({
      surveyId: "pulse",
      respondentId: "user-2",
    });

    const started = await fill.startResponse({ surveyId: "pulse" });
    expect(started.respondentId).toBe("user-1");

    await expect(
      fill.startResponse({ surveyId: "pulse", respondentId: "user-2" }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });

    const resumed = await fill.startResponse({
      surveyId: "pulse",
      resume: true,
    });
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
    const { admin, fill } = session("user-1");
    await publish(admin);
    await fill.startResponse({ surveyId: "pulse" });
    await admin.startResponse({
      surveyId: "pulse",
      respondentId: "user-2",
    });

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

  it("refuses the unpublished survey", async () => {
    const { admin, fill } = session("user-1");
    await publish(admin);
    await expect(fill.getSurvey("pulse")).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.FORBIDDEN.code,
    });
    await expect(
      fill.saveSurvey({ id: "pulse", draftJson: definition }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });
    expect((await admin.getSurvey("pulse")).draftJson).toEqual(definition);
  });

  it("still saves and submits the caller's own draft", async () => {
    const { admin, fill } = session("user-1");
    await publish(admin);
    const started = await fill.startResponse({
      surveyId: "pulse",
      respondentId: "user-1",
    });
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
