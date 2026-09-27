import { SURVEY_ERROR_CODES } from "@dimah-survey/core";
import { describe, expect, it } from "vitest";

import {
  createSession,
  fillUrl,
  publishSurvey,
  textSurvey,
} from "./test/session";

describe("respondent guard", () => {
  it("stamps the session onto start and refuses another respondent", async () => {
    const { editor, fill, respondent } = createSession({
      respondentId: "user-1",
    });
    const user2 = respondent("user-2");
    await publishSurvey(editor);
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
    expect((await editor.getResponse(other.id)).data).toEqual({});
  });

  it("lists only that respondent and refuses the analytics read", async () => {
    const { editor, fill, respondent } = createSession({
      respondentId: "user-1",
    });
    await publishSurvey(editor);
    await fill.startResponse({ surveyId: "pulse" });
    await respondent("user-2").startResponse({ surveyId: "pulse" });

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

    const analytics = await editor.listResponses({ include: "full" });
    expect(analytics.total).toBe(2);
    expect(analytics.responses[0]).toHaveProperty("definition");
  });

  it("has no editor routes on the fill handler", async () => {
    const { fillHandler, editor } = createSession({ respondentId: "user-1" });
    await publishSurvey(editor);
    const response = await fillHandler(
      new Request(fillUrl("/survey?id=pulse")),
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: SURVEY_ERROR_CODES.NOT_FOUND.code,
    });
    expect((await editor.getSurvey("pulse")).draftJson).toEqual(textSurvey);
  });

  it("still saves and submits the caller's own draft", async () => {
    const { editor, fill } = createSession({ respondentId: "user-1" });
    await publishSurvey(editor);
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
      definition: textSurvey,
      data: { q1: "Ada" },
    });
  });
});

describe("anonymous fill", () => {
  it("treats the response id as a capability for that principal only", async () => {
    const { editor, fill, respondent } = createSession();
    const user = respondent("user-1");
    await publishSurvey(editor);
    await expect(fill.getResponse("missing")).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.FORBIDDEN.code,
    });
    await expect(
      fill.startResponse({ surveyId: "pulse", respondentId: "user-1" }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });

    const identified = await user.startResponse({ surveyId: "pulse" });
    const anonymous = await fill.startResponse({ surveyId: "pulse" });
    expect(anonymous.respondentId).toBeNull();
    await expect(fill.getResponse(identified.id)).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.FORBIDDEN.code,
    });
    await expect(user.getResponse(anonymous.id)).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.FORBIDDEN.code,
    });
    expect(await fill.getResponse(anonymous.id)).toMatchObject({
      id: anonymous.id,
    });
    await expect(fill.listResponses()).rejects.toMatchObject({
      code: SURVEY_ERROR_CODES.FORBIDDEN.code,
    });
  });
});
