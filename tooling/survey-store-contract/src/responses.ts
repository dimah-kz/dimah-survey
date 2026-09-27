import { SURVEY_ERROR_CODES } from "@dimah-survey/core";
import { describe, expect, it } from "vitest";

import {
  later,
  publish,
  settings,
  v1,
  v2,
  type OpenSurveyStore,
} from "./helpers";

export function responseContract(open: OpenSurveyStore) {
  describe("responses", () => {
    it("refuses to start a missing, unpublished, or archived survey", async () => {
      const store = await open();
      await expect(
        store.startResponse({ surveyId: "missing" }),
      ).rejects.toMatchObject({
        code: SURVEY_ERROR_CODES.SURVEY_NOT_FOUND.code,
      });
      await store.saveSurvey({ id: "pulse", slug: "pulse", draftJson: v1 });
      await expect(
        store.startResponse({ surveyId: "pulse" }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.NOT_PUBLISHED.code });

      const published = await store.publishSurvey({ id: "pulse" });
      const archived = await store.archiveSurvey({
        id: "pulse",
        expectedUpdatedAt: published.updatedAt,
      });
      await expect(
        store.startResponse({ surveyId: "pulse" }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.NOT_PUBLISHED.code });
      expect(archived.status).toBe("archived");
    });

    it("stores the published snapshot and the canonical survey id", async () => {
      const store = await open();
      const created = await store.saveSurvey({
        id: "survey-1",
        slug: "friendly",
        draftJson: v1,
      });
      await store.publishSurvey({
        id: "survey-1",
        expectedUpdatedAt: created.updatedAt,
      });
      const started = await store.startResponse({ surveyId: "friendly" });
      expect(started.surveyId).toBe("survey-1");
      expect(started.definition).toEqual(v1);
      expect(started.data).toEqual({});
      expect(started.respondentId).toBeNull();

      const edited = await store.saveSurvey({
        id: "survey-1",
        draftJson: v2,
        expectedUpdatedAt: (await store.getSurvey("survey-1"))?.updatedAt,
      });
      await store.publishSurvey({
        id: "survey-1",
        expectedUpdatedAt: edited.updatedAt,
      });
      expect((await store.getResponse(started.id))?.definition).toEqual(v1);
      expect(
        await store.listResponses({ surveyId: "friendly", include: "full" }),
      ).toEqual([]);
      expect(
        await store.listResponses({ surveyId: "survey-1", include: "full" }),
      ).toHaveLength(1);
    });

    it("inserts a new anonymous response on every start", async () => {
      const store = await open();
      await publish(store, { settings: settings({ responses: "single" }) });
      const first = await store.startResponse({ surveyId: "pulse" });
      const second = await store.startResponse({ surveyId: "pulse" });
      expect(second.id).not.toBe(first.id);
      expect(first.respondentId).toBeNull();
      expect(second.respondentId).toBeNull();
    });

    it("returns the open draft for one-open and the latest row for single", async () => {
      const store = await open();
      await publish(store);
      const first = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-1",
      });
      const saved = await store.savePartial({
        id: first.id,
        data: { q1: "Ada" },
        expectedUpdatedAt: first.updatedAt,
      });
      const resumed = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-1",
      });
      expect(resumed.id).toBe(first.id);
      expect(resumed.data).toEqual({ q1: "Ada" });

      await store.submitResponse({
        id: saved.id,
        data: { q1: "Ada" },
        expectedUpdatedAt: saved.updatedAt,
      });
      const next = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-1",
      });
      expect(next.id).not.toBe(first.id);
      expect(next.status).toBe("draft");

      const abandoned = await store.abandonResponse({
        id: next.id,
        expectedUpdatedAt: next.updatedAt,
      });
      const afterAbandon = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-1",
      });
      expect(afterAbandon.id).not.toBe(abandoned.id);

      const other = await publish(store, {
        id: "once",
        settings: settings({ responses: "single" }),
      });
      const once = await store.startResponse({
        surveyId: other.id,
        respondentId: "user-1",
      });
      const done = await store.submitResponse({
        id: once.id,
        data: { q1: "once" },
        expectedUpdatedAt: once.updatedAt,
      });
      const again = await store.startResponse({
        surveyId: other.id,
        respondentId: "user-1",
      });
      expect(again.id).toBe(done.id);
      expect(again.status).toBe("submitted");
    });

    it("collapses concurrent starts for one respondent", async () => {
      const store = await open();
      await publish(store);
      const [first, second] = await Promise.all([
        store.startResponse({ surveyId: "pulse", respondentId: "user-1" }),
        store.startResponse({ surveyId: "pulse", respondentId: "user-1" }),
      ]);
      expect(first.id).toBe(second.id);
      const rows = await store.listResponses({
        surveyId: "pulse",
        include: "full",
      });
      expect(rows).toHaveLength(1);
    });

    it("runs start callbacks only around a new insert", async () => {
      const store = await open();
      await publish(store);
      const seen: string[] = [];
      await store.startResponse(
        { surveyId: "pulse", respondentId: "user-1" },
        {
          onStart: () => {
            seen.push("onStart");
          },
          afterStart: () => {
            seen.push("afterStart");
          },
        },
      );
      await store.startResponse(
        { surveyId: "pulse", respondentId: "user-1" },
        {
          onStart: () => {
            seen.push("onStart");
          },
          afterStart: () => {
            seen.push("afterStart");
          },
        },
      );
      expect(seen).toEqual(["onStart", "afterStart"]);
    });

    it("lets onStart abort the insert and keeps the row when afterStart throws", async () => {
      const store = await open();
      await publish(store);
      await expect(
        store.startResponse(
          { surveyId: "pulse" },
          {
            onStart: () => {
              throw new Error("nope");
            },
          },
        ),
      ).rejects.toThrow("nope");
      expect(await store.countResponses({ surveyId: "pulse" })).toBe(0);

      await expect(
        store.startResponse(
          { surveyId: "pulse" },
          {
            afterStart: () => {
              throw new Error("after");
            },
          },
        ),
      ).rejects.toThrow("after");
      expect(await store.countResponses({ surveyId: "pulse" })).toBe(1);
    });

    it("replaces partial data and rejects a stale or closed partial", async () => {
      const store = await open();
      await publish(store);
      const started = await store.startResponse({ surveyId: "pulse" });
      const saved = await store.savePartial({
        id: started.id,
        data: { q1: "a", q2: "b" },
        expectedUpdatedAt: started.updatedAt,
      });
      expect(saved.definition).toEqual(v1);
      const replaced = await store.savePartial({
        id: started.id,
        data: { q1: "c" },
        expectedUpdatedAt: saved.updatedAt,
      });
      expect(replaced.data).toEqual({ q1: "c" });
      await expect(
        store.savePartial({
          id: started.id,
          data: { q1: "stale" },
          expectedUpdatedAt: "2000-01-01T00:00:00.000Z",
        }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.STALE_UPDATE.code });
      expect((await store.getResponse(started.id))?.data).toEqual({ q1: "c" });

      const submitted = await store.submitResponse({
        id: started.id,
        expectedUpdatedAt: replaced.updatedAt,
      });
      expect(submitted.data).toEqual({ q1: "c" });
      await expect(
        store.savePartial({
          id: started.id,
          data: { q1: "late" },
          expectedUpdatedAt: submitted.updatedAt,
        }),
      ).rejects.toMatchObject({
        code: SURVEY_ERROR_CODES.RESPONSE_CLOSED.code,
      });
      await expect(
        store.savePartial({ id: "missing", data: {} }),
      ).rejects.toMatchObject({
        code: SURVEY_ERROR_CODES.RESPONSE_NOT_FOUND.code,
      });
    });

    it("stores prepared data and leaves the row when afterSubmit throws", async () => {
      const store = await open();
      await publish(store);
      const started = await store.startResponse({ surveyId: "pulse" });
      await expect(
        store.submitResponse(
          {
            id: started.id,
            data: { q1: "raw" },
            expectedUpdatedAt: started.updatedAt,
          },
          {
            prepare: () => {
              throw new Error("invalid");
            },
          },
        ),
      ).rejects.toThrow("invalid");
      expect((await store.getResponse(started.id))?.status).toBe("draft");

      await expect(
        store.submitResponse(
          {
            id: started.id,
            data: { q1: "raw" },
            expectedUpdatedAt: started.updatedAt,
          },
          {
            prepare: () => ({ q1: "clean" }),
            afterSubmit: () => {
              throw new Error("notify");
            },
          },
        ),
      ).rejects.toThrow("notify");
      expect(await store.getResponse(started.id)).toMatchObject({
        status: "submitted",
        data: { q1: "clean" },
        definition: v1,
      });
    });

    it("accepts one of two overlapping submits", async () => {
      const store = await open();
      await publish(store);
      const started = await store.startResponse({ surveyId: "pulse" });
      const body = {
        id: started.id,
        data: { q1: "yes" },
        expectedUpdatedAt: started.updatedAt,
      };
      const settled = await Promise.allSettled([
        store.submitResponse(body),
        store.submitResponse(body),
      ]);
      const rejected = settled.filter((item) => item.status === "rejected");
      expect(
        settled.filter((item) => item.status === "fulfilled"),
      ).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]?.reason).toMatchObject({
        code: SURVEY_ERROR_CODES.RESPONSE_CLOSED.code,
      });
      expect((await store.getResponse(started.id))?.status).toBe("submitted");
    });

    it("does not run afterSubmit when the row is already submitted", async () => {
      const store = await open();
      await publish(store);
      const started = await store.startResponse({ surveyId: "pulse" });
      const submitted = await store.submitResponse({
        id: started.id,
        data: { q1: "yes" },
        expectedUpdatedAt: started.updatedAt,
      });
      let after = 0;
      const replay = await store.submitResponse(
        { id: started.id, data: { q1: "no" } },
        {
          alreadySubmitted: (current) => current,
          afterSubmit: () => {
            after += 1;
          },
        },
      );
      expect(after).toBe(0);
      expect(replay).toMatchObject({
        status: "submitted",
        data: { q1: "yes" },
        updatedAt: submitted.updatedAt,
      });
      await expect(
        store.submitResponse({ id: started.id, data: { q1: "no" } }),
      ).rejects.toMatchObject({
        code: SURVEY_ERROR_CODES.RESPONSE_CLOSED.code,
      });
    });

    it("abandons and reopens without rewriting the snapshot", async () => {
      const store = await open();
      await publish(store);
      const started = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-1",
      });
      const saved = await store.savePartial({
        id: started.id,
        data: { q1: "a" },
        expectedUpdatedAt: started.updatedAt,
      });
      await expect(
        store.reopenResponse({
          id: saved.id,
          expectedUpdatedAt: saved.updatedAt,
        }),
      ).rejects.toMatchObject({
        code: SURVEY_ERROR_CODES.RESPONSE_CLOSED.code,
      });
      const abandoned = await store.abandonResponse({
        id: saved.id,
        expectedUpdatedAt: saved.updatedAt,
      });
      expect(abandoned).toMatchObject({
        status: "abandoned",
        data: { q1: "a" },
        definition: v1,
      });
      const reopened = await store.reopenResponse({
        id: abandoned.id,
        expectedUpdatedAt: abandoned.updatedAt,
      });
      expect(reopened).toMatchObject({
        status: "draft",
        submittedAt: null,
        data: { q1: "a" },
        definition: v1,
      });
      const resumed = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-1",
      });
      expect(resumed.id).toBe(started.id);
    });

    it("rejects reopen while another draft is open", async () => {
      const store = await open();
      await publish(store);
      const first = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-1",
      });
      const submitted = await store.submitResponse({
        id: first.id,
        data: { q1: "yes" },
        expectedUpdatedAt: first.updatedAt,
      });
      const next = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-1",
      });
      expect(next.id).not.toBe(first.id);
      await expect(
        store.reopenResponse({
          id: submitted.id,
          expectedUpdatedAt: submitted.updatedAt,
        }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.OPEN_DRAFT.code });
      expect((await store.getResponse(submitted.id))?.status).toBe("submitted");
    });

    it("lists summary rows, full rows, and counts past the page window", async () => {
      const store = await open();
      await publish(store);
      const first = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-1",
      });
      const submitted = await store.submitResponse({
        id: first.id,
        data: { q1: "yes" },
        expectedUpdatedAt: first.updatedAt,
      });
      await later();
      const second = await store.startResponse({
        surveyId: "pulse",
        respondentId: "user-2",
      });
      expect(second.updatedAt > submitted.updatedAt).toBe(true);

      const newest = await store.listResponses({
        surveyId: "pulse",
        include: "full",
        limit: 1,
      });
      expect(newest.map((row) => row.id)).toEqual([second.id]);
      const summaries = await store.listResponses({ surveyId: "pulse" });
      expect(summaries[0]).not.toHaveProperty("definition");
      expect(summaries[0]).not.toHaveProperty("data");
      const full = await store.listResponses({
        surveyId: "pulse",
        include: "full",
      });
      expect(full).toHaveLength(2);
      expect(full.find((row) => row.id === submitted.id)).toMatchObject({
        definition: v1,
        data: { q1: "yes" },
      });

      expect(
        await store.countResponses({
          surveyId: "pulse",
          limit: 1,
          offset: 10,
          include: "full",
        }),
      ).toBe(2);
      expect(
        await store.countResponses({ surveyId: "pulse", status: "submitted" }),
      ).toBe(1);
      expect(
        await store.countResponses({
          surveyId: "pulse",
          respondentId: "user-2",
        }),
      ).toBe(1);
      expect(submitted.submittedAt).toEqual(expect.any(String));
      const submittedAt = submitted.submittedAt ?? "";
      expect(
        await store.countResponses({
          surveyId: "pulse",
          submittedFrom: submittedAt,
        }),
      ).toBe(1);
      expect(
        await store.countResponses({
          surveyId: "pulse",
          submittedTo: submittedAt,
        }),
      ).toBe(1);
      expect(
        await store.countResponses({
          surveyId: "pulse",
          submittedFrom: "2099-01-01T00:00:00.000Z",
        }),
      ).toBe(0);
      expect(
        await store.countResponses({
          surveyId: "pulse",
          updatedAfter: submitted.updatedAt,
        }),
      ).toBe(1);
      expect(await store.getResponse("missing")).toBeNull();
    });
  });
}
