import { describe, expect, it, vi } from "vitest";

import {
  bindSurveyCreator,
  type SurveyCreatorDraft,
} from "./bind-survey-creator";

function creator(json: SurveyCreatorDraft["JSON"]): SurveyCreatorDraft & {
  save(saveNo?: number): Promise<boolean>;
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

describe("bindSurveyCreator", () => {
  it("writes draft JSON and threads the compare-and-swap token", async () => {
    const draft = creator({ title: "v1" });
    const saveDraft = vi.fn(
      async (_input: { draftJson: unknown; expectedUpdatedAt?: string }) => ({
        updatedAt: "t1",
      }),
    );
    bindSurveyCreator(draft, {
      initialUpdatedAt: "t0",
      saveDraft,
    });
    expect(draft.isAutoSave).toBe(true);

    draft.JSON = { title: "v2" };
    await expect(draft.save()).resolves.toBe(true);
    expect(saveDraft).toHaveBeenCalledWith({
      draftJson: { title: "v2" },
      expectedUpdatedAt: "t0",
    });

    saveDraft.mockResolvedValueOnce({ updatedAt: "t2" });
    draft.JSON = { title: "v3" };
    await expect(draft.save()).resolves.toBe(true);
    expect(saveDraft).toHaveBeenLastCalledWith({
      draftJson: { title: "v3" },
      expectedUpdatedAt: "t1",
    });
  });

  it("waits for the in-flight save before sending the next token", async () => {
    const draft = creator({ title: "v1" });
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const seen: (string | undefined)[] = [];
    bindSurveyCreator(draft, {
      initialUpdatedAt: "t0",
      saveDraft: async ({ expectedUpdatedAt }) => {
        seen.push(expectedUpdatedAt);
        if (seen.length === 1) await gate;
        return { updatedAt: `t${seen.length}` };
      },
    });
    const first = draft.save(1);
    const second = draft.save(2);
    await vi.waitFor(() => expect(seen).toEqual(["t0"]));
    release();
    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
    expect(seen).toEqual(["t0", "t1"]);
  });

  it("reports a failed save and leaves Creator able to save again", async () => {
    const draft = creator({ title: "v1" });
    const onWriteError = vi.fn();
    const saveDraft = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ updatedAt: "t1" });
    bindSurveyCreator(draft, { saveDraft, onWriteError });
    await expect(draft.save()).resolves.toBe(false);
    expect(onWriteError).toHaveBeenCalledOnce();
    await expect(draft.save()).resolves.toBe(true);
    expect(saveDraft).toHaveBeenCalledTimes(2);
  });

  it("ignores a save that finishes after dispose", async () => {
    const draft = creator({ title: "v1" });
    let release: (value: { updatedAt: string }) => void = () => undefined;
    const gate = new Promise<{ updatedAt: string }>((resolve) => {
      release = resolve;
    });
    const saveDraft = vi.fn(() => gate);
    const onWriteError = vi.fn();
    const calls: boolean[] = [];
    const dispose = bindSurveyCreator(draft, {
      initialUpdatedAt: "t0",
      saveDraft,
      onWriteError,
    });
    draft.saveSurveyFunc(1, (_saveNo, success) => {
      calls.push(success);
    });
    await vi.waitFor(() => expect(saveDraft).toHaveBeenCalledOnce());
    dispose();
    release({ updatedAt: "t9" });
    await vi.waitFor(() => expect(draft.isAutoSave).toBe(false));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(calls).toEqual([]);
    expect(onWriteError).not.toHaveBeenCalled();
  });

  it("restores the previous save function", async () => {
    const draft = creator({ title: "v1" });
    const saveDraft = vi.fn(async () => ({ updatedAt: "t1" }));
    const dispose = bindSurveyCreator(draft, { saveDraft });
    dispose();
    expect(draft.isAutoSave).toBe(false);
    await expect(draft.save()).resolves.toBe(true);
    expect(saveDraft).not.toHaveBeenCalled();
  });
});
