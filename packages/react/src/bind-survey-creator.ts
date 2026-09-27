import type { SurveyJson } from "@dimah-survey/core";

import { createWriteQueue } from "./write-queue";

/**
 * The slice of Survey Creator this binding writes.
 * Autosave calls `saveSurveyFunc`. This package does not construct or render Creator.
 */
export type SurveyCreatorDraft = {
  JSON: SurveyJson;
  isAutoSave: boolean;
  saveSurveyFunc: (
    saveNo: number,
    callback: (saveNo: number, success: boolean) => void,
  ) => void;
};

export type SurveyCreatorActions = {
  /** `updatedAt` from the survey loaded into Creator. */
  initialUpdatedAt?: string;
  saveDraft: (input: {
    draftJson: SurveyJson;
    expectedUpdatedAt?: string;
  }) => Promise<{ updatedAt: string }>;
  /** Creator save failed. Creator stays on the page. */
  onWriteError?: (error: unknown) => void;
};

/**
 * Persist Creator edits as `draftJson` only.
 * Sets `isAutoSave` and `saveSurveyFunc`. Publish stays a separate call.
 */
export function bindSurveyCreator(
  creator: SurveyCreatorDraft,
  actions: SurveyCreatorActions,
) {
  const previousSave = creator.saveSurveyFunc;
  const previousAuto = creator.isAutoSave;
  let updatedAt = actions.initialUpdatedAt;
  let disposed = false;
  const enqueue = createWriteQueue();
  creator.isAutoSave = true;
  creator.saveSurveyFunc = (saveNo, callback) => {
    void enqueue(async () => {
      if (disposed) return;
      try {
        const saved = await actions.saveDraft({
          draftJson: structuredClone(creator.JSON),
          expectedUpdatedAt: updatedAt,
        });
        if (disposed) return;
        updatedAt = saved.updatedAt;
        callback(saveNo, true);
      } catch (error: unknown) {
        if (disposed) return;
        actions.onWriteError?.(error);
        callback(saveNo, false);
      }
    });
  };
  return () => {
    disposed = true;
    creator.saveSurveyFunc = previousSave;
    creator.isAutoSave = previousAuto;
  };
}
