import type { SurveyResult } from "@dimah-survey/core";
import type { Model } from "survey-core";

export type SurveyModelActions = {
  savePartial: (data: SurveyResult) => Promise<void>;
  submit: (data: SurveyResult) => Promise<void>;
  onPartialError?: (error: unknown) => void;
};

type CompletingOptions = {
  allow: boolean;
  /** SurveyJS 2 name for `allow`. Set both so either version blocks completion. */
  allowComplete?: boolean;
  message?: string;
};

/**
 * Wire a survey-core Model to partial save and submit.
 * Completion waits for the server. The app still renders `<Survey model={model} />`.
 */
export function bindSurveyModel(model: Model, actions: SurveyModelActions) {
  model.sendResultOnPageNext = true;
  const onPartial = () => {
    void actions.savePartial({ ...model.data }).catch((error: unknown) => {
      actions.onPartialError?.(error);
    });
  };
  const onCompleting = async (sender: Model, options: CompletingOptions) => {
    try {
      await actions.submit({ ...sender.data });
    } catch (error: unknown) {
      options.allow = false;
      options.allowComplete = false;
      options.message = error instanceof Error ? error.message : "Save failed.";
    }
  };
  model.onPartialSend.add(onPartial);
  model.onCompleting.add(onCompleting);
  return () => {
    model.onPartialSend.remove(onPartial);
    model.onCompleting.remove(onCompleting);
  };
}
