// @vitest-environment happy-dom

import {
  APIError,
  DEFAULT_SURVEY_SETTINGS,
  SURVEY_ERROR_CODES,
  type SurveyJson,
  type SurveyRecord,
} from "@dimah-survey/core";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import type { SurveyCreatorDraft } from "./bind-survey-creator";
import { renderHook } from "./test/render-hook";
import { useSurveyDraft } from "./use-survey-draft";

function record(updatedAt: string): SurveyRecord {
  return {
    id: "pulse",
    slug: "pulse",
    status: "draft",
    draftJson: { title: "v1" },
    publishedJson: null,
    publishedAt: null,
    settings: { ...DEFAULT_SURVEY_SETTINGS },
    createdAt: "t0",
    updatedAt,
  };
}

function creator(json: SurveyJson): SurveyCreatorDraft & {
  save(): Promise<boolean>;
} {
  const target: SurveyCreatorDraft = {
    JSON: json,
    isAutoSave: false,
    saveSurveyFunc: (_saveNo, callback) => {
      callback(_saveNo, true);
    },
  };
  return Object.assign(target, {
    save(saveNo = 1) {
      return new Promise<boolean>((resolve) => {
        target.saveSurveyFunc(saveNo, (_no, success) => {
          resolve(success);
        });
      });
    },
  });
}

describe("useSurveyDraft", () => {
  it("saves draft JSON with the compare-and-swap token", async () => {
    const draft = creator({ title: "v1" });
    const saveSurvey = vi.fn(async () => record("t1"));
    const view = await renderHook(
      (props: { updatedAt?: string }) =>
        useSurveyDraft({
          client: { saveSurvey },
          surveyId: "pulse",
          creator: draft,
          updatedAt: props.updatedAt,
        }),
      { updatedAt: "t0" },
    );
    expect(draft.isAutoSave).toBe(true);
    draft.JSON = { title: "v2" };
    await expect(draft.save()).resolves.toBe(true);
    expect(saveSurvey).toHaveBeenCalledWith({
      id: "pulse",
      draftJson: { title: "v2" },
      expectedUpdatedAt: "t0",
    });
    draft.JSON = { title: "v3" };
    await expect(draft.save()).resolves.toBe(true);
    expect(saveSurvey).toHaveBeenLastCalledWith({
      id: "pulse",
      draftJson: { title: "v3" },
      expectedUpdatedAt: "t1",
    });

    await view.rerender({ updatedAt: "t9" });
    draft.JSON = { title: "v4" };
    await expect(draft.save()).resolves.toBe(true);
    expect(saveSurvey).toHaveBeenLastCalledWith({
      id: "pulse",
      draftJson: { title: "v4" },
      expectedUpdatedAt: "t9",
    });
    await view.unmount();
  });

  it("records a failed save and clears it after the next success", async () => {
    const draft = creator({ title: "v1" });
    const saveSurvey = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(
        APIError.from("CONFLICT", SURVEY_ERROR_CODES.STALE_UPDATE),
      )
      .mockResolvedValueOnce(record("t1"));
    const view = await renderHook(
      () =>
        useSurveyDraft({
          client: { saveSurvey },
          surveyId: "pulse",
          creator: draft,
        }),
      {},
    );
    await expect(draft.save()).resolves.toBe(false);
    await vi.waitFor(() =>
      expect(view.result.current.saveError?.message).toBe("offline"),
    );
    expect(view.result.current.stale).toBe(false);

    await expect(draft.save()).resolves.toBe(false);
    await vi.waitFor(() => expect(view.result.current.stale).toBe(true));

    await expect(draft.save()).resolves.toBe(true);
    await vi.waitFor(() => expect(view.result.current.saveError).toBeNull());
    expect(view.result.current.stale).toBe(false);
    await view.unmount();
  });

  it("does nothing without a creator", async () => {
    const saveSurvey = vi.fn(async () => record("t1"));
    const view = await renderHook(
      () =>
        useSurveyDraft({
          client: { saveSurvey },
          surveyId: "pulse",
          creator: null,
        }),
      {},
    );
    expect(saveSurvey).not.toHaveBeenCalled();
    await view.unmount();
  });

  it("ignores a save that finishes after unmount", async () => {
    const draft = creator({ title: "v1" });
    let release: (error: Error) => void = () => undefined;
    const saveSurvey = vi.fn(
      () =>
        new Promise<SurveyRecord>((_resolve, reject) => {
          release = reject;
        }),
    );
    const calls: boolean[] = [];
    const view = await renderHook(
      () =>
        useSurveyDraft({
          client: { saveSurvey },
          surveyId: "pulse",
          creator: draft,
          updatedAt: "t0",
        }),
      {},
    );
    draft.saveSurveyFunc(1, (_saveNo, success) => {
      calls.push(success);
    });
    await vi.waitFor(() => expect(saveSurvey).toHaveBeenCalledOnce());
    await view.unmount();
    await act(async () => {
      release(new Error("offline"));
    });
    expect(calls).toEqual([]);
    expect(view.result.current.saveError).toBeNull();
  });
});
