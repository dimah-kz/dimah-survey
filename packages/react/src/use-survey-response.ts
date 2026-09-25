import { useEffect, useRef, useState } from "react";
import { Model } from "survey-core";
import type { SurveyClient } from "@dimah-survey/core";

import { bindSurveyModel } from "./bind-survey-model";

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
    setModel(null);
    setError(null);
    updatedAt.current = undefined;
    void client
      .getResponse(responseId)
      .then((response) => {
        if (cancelled) return;
        updatedAt.current = response.updatedAt;
        const next = new Model(response.definition);
        next.data = response.data;
        if (response.status !== "draft") next.mode = "display";
        const asError = (cause: unknown) =>
          cause instanceof Error ? cause : new Error("Save failed.");
        dispose = bindSurveyModel(next, {
          savePartial: (data) =>
            client
              .savePartial({
                id: responseId,
                data,
                expectedUpdatedAt: updatedAt.current,
              })
              .then((saved) => {
                updatedAt.current = saved.updatedAt;
              }),
          submit: (data) =>
            client
              .submitResponse({
                id: responseId,
                data,
                expectedUpdatedAt: updatedAt.current,
              })
              .then((saved) => {
                updatedAt.current = saved.updatedAt;
              }),
          onPartialError: (cause) => {
            if (!cancelled) setError(asError(cause));
          },
        });
        setModel(next);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause : new Error("Load failed."));
        }
      });
    return () => {
      cancelled = true;
      dispose();
    };
  }, [client, responseId]);

  return { model, error };
}
