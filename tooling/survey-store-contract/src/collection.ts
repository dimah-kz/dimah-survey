import { SURVEY_ERROR_CODES } from "@dimah-survey/core";
import { describe, expect, it } from "vitest";

import { publish, settings, v1, type OpenSurveyStore } from "./helpers";

export function collectionContract(open: OpenSurveyStore) {
  describe("collection", () => {
    it("closes start, partial, and submit outside the window", async () => {
      const store = await open();
      const published = await publish(store);
      const scheduled = await store.saveSurveySettings({
        id: "pulse",
        settings: settings({ opensAt: "2099-01-01T00:00:00.000Z" }),
        expectedUpdatedAt: published.updatedAt,
      });
      await expect(
        store.startResponse({ surveyId: "pulse" }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SURVEY_CLOSED.code });

      const opened = await store.saveSurveySettings({
        id: "pulse",
        settings: settings(),
        expectedUpdatedAt: scheduled.updatedAt,
      });
      const started = await store.startResponse({ surveyId: "pulse" });
      const saved = await store.savePartial({
        id: started.id,
        data: { q1: "in time" },
        expectedUpdatedAt: started.updatedAt,
      });
      await store.saveSurveySettings({
        id: "pulse",
        settings: settings({ closesAt: "2000-01-01T00:00:00.000Z" }),
        expectedUpdatedAt: opened.updatedAt,
      });

      await expect(
        store.startResponse({ surveyId: "pulse" }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SURVEY_CLOSED.code });
      await expect(
        store.savePartial({
          id: started.id,
          data: { q1: "late" },
          expectedUpdatedAt: saved.updatedAt,
        }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SURVEY_CLOSED.code });
      await expect(
        store.submitResponse({
          id: started.id,
          data: { q1: "late" },
          expectedUpdatedAt: saved.updatedAt,
        }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SURVEY_CLOSED.code });
      expect((await store.getResponse(started.id))?.data).toEqual({
        q1: "in time",
      });

      const abandoned = await store.abandonResponse({
        id: started.id,
        expectedUpdatedAt: saved.updatedAt,
      });
      expect(abandoned.status).toBe("abandoned");
      const reopened = await store.reopenResponse({
        id: abandoned.id,
        expectedUpdatedAt: abandoned.updatedAt,
      });
      expect(reopened.status).toBe("draft");
      expect(reopened.definition).toEqual(v1);
    });

    it("stops a new start and a second submit at the response cap", async () => {
      const store = await open();
      await publish(store, { settings: settings({ maxResponses: 1 }) });
      const first = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-1",
      });
      const second = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-2",
      });
      const submitted = await store.submitResponse({
        id: first.id,
        data: { q1: "only" },
        expectedUpdatedAt: first.updatedAt,
      });
      expect(submitted.status).toBe("submitted");
      await expect(
        store.submitResponse({
          id: second.id,
          data: { q1: "too many" },
          expectedUpdatedAt: second.updatedAt,
        }),
      ).rejects.toMatchObject({
        code: SURVEY_ERROR_CODES.RESPONSE_LIMIT.code,
      });
      await expect(
        store.startResponse({ surveyId: "pulse", respondentId: "user-3" }),
      ).rejects.toMatchObject({
        code: SURVEY_ERROR_CODES.RESPONSE_LIMIT.code,
      });
      expect((await store.getResponse(second.id))?.status).toBe("draft");
    });

    it("refuses reopen when the survey disallows it", async () => {
      const store = await open();
      await publish(store, { settings: settings({ reopen: false }) });
      const started = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-1",
      });
      const submitted = await store.submitResponse({
        id: started.id,
        data: { q1: "done" },
        expectedUpdatedAt: started.updatedAt,
      });
      await expect(
        store.reopenResponse({
          id: submitted.id,
          expectedUpdatedAt: submitted.updatedAt,
        }),
      ).rejects.toMatchObject({
        code: SURVEY_ERROR_CODES.RESPONSE_CLOSED.code,
      });
      expect((await store.getResponse(submitted.id))?.status).toBe("submitted");
    });
  });
}
