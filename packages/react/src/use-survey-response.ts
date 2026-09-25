import { useEffect, useState } from "react";
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

  useEffect(() => {
    let dispose = () => undefined;
    let cancelled = false;
    setModel(null);
    setError(null);
    void client
      .getResponse(responseId)
      .then((response) => {
        if (cancelled) return;
        const next = new Model(response.definition);
        next.data = response.data;
        if (response.status !== "draft") next.mode = "display";
        dispose = bindSurveyModel(next, {
          savePartial: (data) =>
            client.savePartial({ id: responseId, data }).then(() => undefined),
          submit: (data) =>
            client
              .submitResponse({ id: responseId, data })
              .then(() => undefined),
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
