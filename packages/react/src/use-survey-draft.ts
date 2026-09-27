import { useEffect, useState } from "react";
import type { EditorClient } from "@dimah-survey/core";

import {
  bindSurveyCreator,
  type SurveyCreatorDraft,
} from "./bind-survey-creator";
import { isStaleUpdate } from "./stale";

/** State returned by `useSurveyDraft`. */
export type SurveyDraftBinding = {
  /** The last draft save failed. Creator stays mounted. */
  saveError: Error | null;
  /**
   * The last save failed with `STALE_UPDATE`.
   * This hook has no `reload`. Load the survey again before writing.
   */
  stale: boolean;
};

/** Options for `useSurveyDraft`. */
export type UseSurveyDraftOptions = {
  /** Editor client used for `saveSurvey`. */
  client: Pick<EditorClient, "saveSurvey">;
  /** Draft to write. */
  surveyId: string;
  /** Existing Creator instance. `null` skips binding. */
  creator: SurveyCreatorDraft | null;
  /** Compare-and-swap token from the read that loaded Creator. */
  updatedAt?: string;
};

/**
 * Bind an existing Creator to `saveSurvey`.
 * Pass `updatedAt` from the load that produced `creator`. A new value rebinds
 * the compare-and-swap token. This hook does not construct Creator.
 */
export function useSurveyDraft(
  options: UseSurveyDraftOptions,
): SurveyDraftBinding {
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
