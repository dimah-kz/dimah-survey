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

export function surveyDocumentContract(open: OpenSurveyStore) {
  describe("documents", () => {
    it("saves a draft without publishing or touching collection settings", async () => {
      const store = await open();
      const created = await store.saveSurvey({
        id: "pulse",
        slug: "pulse",
        draftJson: v1,
      });
      expect(created).toMatchObject({
        id: "pulse",
        slug: "pulse",
        status: "draft",
        draftJson: v1,
        publishedJson: null,
        publishedAt: null,
        settings: settings(),
      });

      const configured = await store.saveSurveySettings({
        id: "pulse",
        settings: settings({ reopen: false, maxResponses: 3 }),
        expectedUpdatedAt: created.updatedAt,
      });
      const saved = await store.saveSurvey({
        id: "pulse",
        draftJson: v2,
        expectedUpdatedAt: configured.updatedAt,
      });
      expect(saved.draftJson).toEqual(v2);
      expect(saved.publishedJson).toBeNull();
      expect(saved.settings).toEqual(
        settings({ reopen: false, maxResponses: 3 }),
      );
      expect((await store.getSurvey("pulse"))?.updatedAt).toBe(saved.updatedAt);
    });

    it("rejects a stale write and does not apply it", async () => {
      const store = await open();
      const created = await store.saveSurvey({
        id: "pulse",
        slug: "pulse",
        draftJson: v1,
      });
      await expect(
        store.saveSurvey({
          id: "pulse",
          draftJson: v2,
          expectedUpdatedAt: "2000-01-01T00:00:00.000Z",
        }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.STALE_UPDATE.code });
      await expect(
        store.saveSurvey({
          id: "missing",
          draftJson: v1,
          expectedUpdatedAt: created.updatedAt,
        }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.STALE_UPDATE.code });
      expect((await store.getSurvey("pulse"))?.draftJson).toEqual(v1);
      expect(await store.getSurvey("missing")).toBeNull();
    });

    it("keeps a later edit of the caller's object off the stored draft", async () => {
      const store = await open();
      const draftJson = { title: "v1", pages: [] as unknown[] };
      const created = await store.saveSurvey({
        id: "pulse",
        slug: "pulse",
        draftJson,
      });
      draftJson.title = "mutated";
      created.draftJson.title = "returned";
      const stored = await store.getSurvey("pulse");
      expect(stored?.draftJson).toEqual({ title: "v1", pages: [] });

      const published = await store.publishSurvey({
        id: "pulse",
        expectedUpdatedAt: stored?.updatedAt,
      });
      expect(published.publishedJson).toEqual({ title: "v1", pages: [] });
      expect(published.draftJson).toEqual({ title: "v1", pages: [] });
    });

    it("publishes a copy of the draft and leaves an open response on that copy", async () => {
      const store = await open();
      const published = await publish(store);
      const started = await store.startResponse({ surveyId: "pulse" });
      expect(started.definition).toEqual(v1);
      expect(started.surveyId).toBe("pulse");

      const edited = await store.saveSurvey({
        id: "pulse",
        draftJson: v2,
        expectedUpdatedAt: published.updatedAt,
      });
      expect(edited.publishedJson).toEqual(v1);
      expect(edited.status).toBe("active");
      await expect(
        store.publishSurvey({
          id: "pulse",
          expectedUpdatedAt: "2000-01-01T00:00:00.000Z",
        }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.STALE_UPDATE.code });
      const next = await store.publishSurvey({
        id: "pulse",
        expectedUpdatedAt: edited.updatedAt,
      });
      expect(next.publishedJson).toEqual(v2);
      expect(next.publishedVersionId).not.toBe(published.publishedVersionId);
      expect((await store.getResponse(started.id))?.definition).toEqual(v1);
      expect((await store.getResponse(started.id))?.versionId).toBe(
        published.publishedVersionId,
      );

      const again = await store.startResponse({ surveyId: "pulse" });
      expect(again.id).not.toBe(started.id);
      expect(again.definition).toEqual(v2);
      expect(again.versionId).toBe(next.publishedVersionId);
    });

    it("reuses a version when the published document is unchanged", async () => {
      const store = await open();
      const first = await publish(store);
      await later();
      const same = await store.publishSurvey({
        id: "pulse",
        expectedUpdatedAt: first.updatedAt,
      });
      expect(same.publishedVersionId).toBe(first.publishedVersionId);
      expect(same.publishedAt).not.toBe(first.publishedAt);

      const reordered = await store.saveSurvey({
        id: "pulse",
        draftJson: { pages: [], title: "v1" },
        expectedUpdatedAt: same.updatedAt,
      });
      const still = await store.publishSurvey({
        id: "pulse",
        expectedUpdatedAt: reordered.updatedAt,
      });
      expect(still.publishedVersionId).toBe(first.publishedVersionId);
      expect(
        await store.listSurveyVersions({ surveyId: "pulse" }),
      ).toHaveLength(1);

      const edited = await store.saveSurvey({
        id: "pulse",
        draftJson: { title: "v1.", pages: [] },
        expectedUpdatedAt: still.updatedAt,
      });
      const changed = await store.publishSurvey({
        id: "pulse",
        expectedUpdatedAt: edited.updatedAt,
      });
      expect(changed.publishedVersionId).not.toBe(first.publishedVersionId);
      const history = await store.listSurveyVersions({ surveyId: "pulse" });
      expect(history.map((version) => version.id)).toEqual([
        changed.publishedVersionId,
        first.publishedVersionId,
      ]);
      const kept = await store.saveSurveySettings({
        id: "pulse",
        settings: settings({ maxResponses: 4 }),
        expectedUpdatedAt: changed.updatedAt,
      });
      expect(kept.publishedVersionId).toBe(changed.publishedVersionId);
      expect(await store.listSurveyVersions({ surveyId: "missing" })).toEqual(
        [],
      );
    });

    it("resumes an archived survey without publishing the open draft", async () => {
      const store = await open();
      const published = await publish(store);
      const edited = await store.saveSurvey({
        id: "pulse",
        draftJson: v2,
        expectedUpdatedAt: published.updatedAt,
      });
      const archived = await store.archiveSurvey({
        id: "pulse",
        expectedUpdatedAt: edited.updatedAt,
      });
      expect(archived.status).toBe("archived");
      expect(archived.publishedJson).toEqual(v1);
      expect(archived.draftJson).toEqual(v2);

      const resumed = await store.resumeSurvey({
        id: "pulse",
        expectedUpdatedAt: archived.updatedAt,
      });
      expect(resumed.status).toBe("active");
      expect(resumed.publishedJson).toEqual(v1);
      expect(resumed.draftJson).toEqual(v2);
      const again = await store.resumeSurvey({
        id: "pulse",
        expectedUpdatedAt: "2000-01-01T00:00:00.000Z",
      });
      expect(again.updatedAt).toBe(resumed.updatedAt);
      expect(again.status).toBe("active");
    });

    it("refuses to resume a survey that was never published", async () => {
      const store = await open();
      await store.saveSurvey({ id: "pulse", slug: "pulse", draftJson: v1 });
      await expect(store.resumeSurvey({ id: "pulse" })).rejects.toMatchObject({
        code: SURVEY_ERROR_CODES.NOT_PUBLISHED.code,
      });
      expect((await store.getSurvey("pulse"))?.status).toBe("draft");
    });

    it("resolves a slug and rejects one that another survey owns", async () => {
      const store = await open();
      const created = await store.saveSurvey({
        id: "a",
        slug: "one",
        draftJson: v1,
      });
      expect((await store.getSurvey("one"))?.id).toBe("a");
      const renamed = await store.saveSurvey({
        id: "a",
        slug: "two",
        draftJson: v1,
        expectedUpdatedAt: created.updatedAt,
      });
      expect(await store.getSurvey("one")).toBeNull();
      expect((await store.getSurvey("two"))?.id).toBe("a");

      const other = await store.saveSurvey({
        id: "b",
        slug: "kept",
        draftJson: v1,
      });
      await expect(
        store.saveSurvey({
          id: "b",
          slug: "two",
          draftJson: v2,
          expectedUpdatedAt: other.updatedAt,
        }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SLUG_TAKEN.code });
      await expect(
        store.saveSurvey({
          id: "b",
          slug: "a",
          draftJson: v2,
          expectedUpdatedAt: other.updatedAt,
        }),
      ).rejects.toMatchObject({ code: SURVEY_ERROR_CODES.SLUG_TAKEN.code });
      expect((await store.getSurvey("kept"))?.draftJson).toEqual(v1);
      expect((await store.getSurvey("a"))?.draftJson).toEqual(v1);
      expect(renamed.slug).toBe("two");
    });

    it("lets one of two concurrent slug claims win", async () => {
      const store = await open();
      const settled = await Promise.allSettled([
        store.saveSurvey({ id: "a", slug: "pulse", draftJson: v1 }),
        store.saveSurvey({ id: "b", slug: "pulse", draftJson: v1 }),
      ]);
      const rejected = settled.filter((item) => item.status === "rejected");
      expect(
        settled.filter((item) => item.status === "fulfilled"),
      ).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]?.reason).toMatchObject({
        code: SURVEY_ERROR_CODES.SLUG_TAKEN.code,
      });
    });

    it("pages surveys by updatedAt and status", async () => {
      const store = await open();
      const first = await store.saveSurvey({
        id: "a",
        slug: "a",
        draftJson: v1,
      });
      await later();
      const second = await store.saveSurvey({
        id: "b",
        slug: "b",
        draftJson: v2,
      });
      expect(second.updatedAt > first.updatedAt).toBe(true);

      const newest = await store.listSurveys({ limit: 1 });
      expect(newest.map((survey) => survey.id)).toEqual(["b"]);
      const rest = await store.listSurveys({ limit: 1, offset: 1 });
      expect(rest.map((survey) => survey.id)).toEqual(["a"]);
      expect(await store.listSurveys({ limit: 1, offset: 2 })).toEqual([]);

      await store.archiveSurvey({
        id: "b",
        expectedUpdatedAt: second.updatedAt,
      });
      expect(
        (await store.listSurveys({ status: "archived" })).map(
          (survey) => survey.id,
        ),
      ).toEqual(["b"]);
      expect(
        (await store.listSurveys({ status: "draft" })).map(
          (survey) => survey.id,
        ),
      ).toEqual(["a"]);
    });
  });
}
