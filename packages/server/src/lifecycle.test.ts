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
    const survey = dimahSurvey({
      database: memoryAdapter(),
      validateResult: () => undefined,
      guard: () => {
        throw APIError.from("FORBIDDEN", SURVEY_ERROR_CODES.FORBIDDEN);
      },
    });
    await expect(
      survey.api.saveSurvey({ body: { id: "x", draftJson: v1 } }),
    ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.FORBIDDEN.code });
  });
});
