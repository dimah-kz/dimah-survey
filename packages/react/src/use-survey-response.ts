import { useCallback, useEffect, useRef, useState } from "react";
import { Model } from "survey-core";
import type { FillClient } from "@dimah-survey/core";

import { bindSurveyModel, type SurveyPartialSend } from "./bind-survey-model";
import { isStaleUpdate } from "./stale";
import { createWriteQueue } from "./write-queue";

/** State returned by `useSurveyResponse`. */
export type SurveyResponseBinding = {
  /** Hydrated snapshot. `null` while loading or after a load error. */
  model: Model | null;
  /** The snapshot failed to load. `model` is `null`. */
  error: Error | null;
  /** A partial save or submit failed. `model` stays mounted. */
  saveError: Error | null;
  /** The last write failed with `STALE_UPDATE`. Call `reload`. */
  stale: boolean;
  /** Read the stored snapshot again and clear the write error. */
  reload: () => void;
};

/** Options for `useSurveyResponse`. */
export type UseSurveyResponseOptions = {
  /** Fill client used for load, partial save, and submit. */
  client: Pick<FillClient, "getResponse" | "savePartial" | "submitResponse">;
  /** Response row to hydrate. */
  responseId: string;
  /**
   * `"page"` sets `partialSendEnabled` and `sendResultOnPageNext`.
   * `"off"` writes only on complete.
   * @default "page"
   */
  partial?: SurveyPartialSend;
};

/**
 * Load a response snapshot into a survey-core `Model` and bind server writes.
 * Does not render UI. A non-draft response opens in `display` mode.
 */
export function useSurveyResponse(
  options: UseSurveyResponseOptions,
): SurveyResponseBinding {
  const { client, responseId, partial } = options;
  const [epoch, setEpoch] = useState(0);
  const [model, setModel] = useState<Model | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const updatedAt = useRef<string | undefined>(undefined);
  const shownFor = useRef<string | undefined>(undefined);
  const reload = useCallback(() => {
    setEpoch((current) => current + 1);
  }, []);

  useEffect(() => {
    let dispose: () => void = () => undefined;
    let cancelled = false;
    const enqueue = createWriteQueue();
    if (shownFor.current !== responseId) {
      setModel(null);
      setSaveError(null);
      shownFor.current = undefined;
    }
    setError(null);
    updatedAt.current = undefined;

    const remember = (next: string) => {
      if (!cancelled) updatedAt.current = next;
    };
    const asError = (cause: unknown, fallback: string) =>
      cause instanceof Error ? cause : new Error(fallback);
    const failWrite = (cause: unknown) => {
      if (!cancelled) setSaveError(asError(cause, "Save failed."));
    };

    void client
      .getResponse(responseId)
      .then((response) => {
        if (cancelled) return;
        updatedAt.current = response.updatedAt;
        const next = new Model(response.definition);
        next.data = response.data;
        shownFor.current = responseId;
        setSaveError(null);
        if (response.status !== "draft") {
          next.mode = "display";
          setModel(next);
          return;
        }
        dispose = bindSurveyModel(
          next,
          {
            savePartial: (data) =>
              enqueue(async () => {
                const saved = await client.savePartial({
                  id: responseId,
                  data,
                  expectedUpdatedAt: updatedAt.current,
                });
                remember(saved.updatedAt);
                if (!cancelled) setSaveError(null);
              }),
            submit: (data) =>
              enqueue(async () => {
                const saved = await client.submitResponse({
                  id: responseId,
                  data,
                  expectedUpdatedAt: updatedAt.current,
                });
                remember(saved.updatedAt);
                if (!cancelled) setSaveError(null);
              }),
            onWriteError: failWrite,
          },
          { partial },
        );
        setModel(next);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          shownFor.current = undefined;
          setModel(null);
          setError(asError(cause, "Load failed."));
        }
      });
    return () => {
      cancelled = true;
      dispose();
    };
  }, [client, partial, responseId, epoch]);

  return { model, error, saveError, stale: isStaleUpdate(saveError), reload };
}
