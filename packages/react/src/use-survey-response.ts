import { useCallback, useEffect, useRef, useState } from "react";
import { Model } from "survey-core";
import type { FillClient } from "@dimah-survey/core";

import { bindSurveyModel } from "./bind-survey-model";
import { isStaleUpdate } from "./stale";
import { createWriteQueue } from "./write-queue";

export type SurveyResponseBinding = {
  model: Model | null;
  /** The snapshot failed to load. `model` is null. */
  error: Error | null;
  /** A partial save or submit failed. `model` stays mounted. */
  saveError: Error | null;
  /** `saveError` is a compare-and-swap conflict. Call `reload`. */
  stale: boolean;
  /** Load the stored snapshot again. */
  reload: () => void;
};

export function useSurveyResponse(options: {
  client: Pick<FillClient, "getResponse" | "savePartial" | "submitResponse">;
  responseId: string;
}): SurveyResponseBinding {
  const { client, responseId } = options;
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
        dispose = bindSurveyModel(next, {
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
        });
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
  }, [client, responseId, epoch]);

  return { model, error, saveError, stale: isStaleUpdate(saveError), reload };
}
