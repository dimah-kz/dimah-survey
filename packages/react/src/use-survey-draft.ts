import { useEffect, useState } from "react";
import type { EditorClient } from "@dimah-survey/core";

import {
  bindSurveyCreator,
  type SurveyCreatorDraft,
} from "./bind-survey-creator";
import { isStaleUpdate } from "./stale";

export type SurveyDraftBinding = {
  /** The last draft save failed. Creator stays mounted. */
  saveError: Error | null;
  /** `saveError` is a compare-and-swap conflict. */
  stale: boolean;
};

/**
 * Bind an existing Creator to `saveSurvey`.
 * Pass `updatedAt` from the load that produced `creator`. A new value rebinds
 * the compare-and-swap token. This hook does not construct Creator.
 */
export function useSurveyDraft(options: {
  client: Pick<EditorClient, "saveSurvey">;
  surveyId: string;
  creator: SurveyCreatorDraft | null;
  updatedAt?: string;
}): SurveyDraftBinding {
  const { client, surveyId, creator, updatedAt } = options;
  const [saveError, setSaveError] = useState<Error | null>(null);

  useEffect(() => {
    if (!creator) return;
    let cancelled = false;
    const asError = (cause: unknown) =>
      cause instanceof Error ? cause : new Error("Save failed.");
    const dispose = bindSurveyCreator(creator, {
      initialUpdatedAt: updatedAt,
      saveDraft: async ({ draftJson, expectedUpdatedAt }) => {
        const saved = await client.saveSurvey({
          id: surveyId,
          draftJson,
          expectedUpdatedAt,
        });
        if (!cancelled) setSaveError(null);
        return saved;
      },
      onWriteError: (cause) => {
        if (!cancelled) setSaveError(asError(cause));
      },
    });
    return () => {
      cancelled = true;
      dispose();
    };
  }, [client, creator, surveyId, updatedAt]);

  return { saveError, stale: isStaleUpdate(saveError) };
}
