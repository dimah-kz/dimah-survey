import { useEffect, useRef, useState } from "react";
import { Model } from "survey-core";
import type { SurveyClient } from "@dimah-survey/core";

import { bindSurveyModel } from "./bind-survey-model";
import { createWriteQueue } from "./write-queue";

export function useSurveyResponse(options: {
  client: SurveyClient;
  responseId: string;
}) {
  const { client, responseId } = options;
  const [model, setModel] = useState<Model | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const updatedAt = useRef<string | undefined>(undefined);

  useEffect(() => {
    let dispose: () => void = () => undefined;
    let cancelled = false;
    const enqueue = createWriteQueue();
    setModel(null);
    setError(null);
    updatedAt.current = undefined;

    const remember = (next: string) => {
      if (!cancelled) updatedAt.current = next;
    };
    const asError = (cause: unknown, fallback: string) =>
      cause instanceof Error ? cause : new Error(fallback);

    void client
      .getResponse(responseId)
      .then((response) => {
        if (cancelled) return;
        updatedAt.current = response.updatedAt;
        const next = new Model(response.definition);
        next.data = response.data;
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
            }),
          submit: (data) =>
            enqueue(async () => {
              const saved = await client.submitResponse({
                id: responseId,
                data,
                expectedUpdatedAt: updatedAt.current,
              });
              remember(saved.updatedAt);
            }),
          onPartialError: (cause) => {
            if (!cancelled) setError(asError(cause, "Save failed."));
          },
        });
        setModel(next);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(asError(cause, "Load failed."));
      });
    return () => {
      cancelled = true;
      dispose();
    };
  }, [client, responseId]);

  return { model, error };
}
