import type { SurveyResult } from "@dimah-survey/core";
import type { Model } from "survey-core";

export type SurveyModelActions = {
  savePartial: (data: SurveyResult) => Promise<void>;
  submit: (data: SurveyResult) => Promise<void>;
};

/**
 * Wire a survey-core Model to partial save and submit.
 * The app still renders `<Survey model={model} />` itself.
 */
export function bindSurveyModel(model: Model, actions: SurveyModelActions) {
  model.sendResultOnPageNext = true;
  const onPartial = () => {
    void actions.savePartial({ ...model.data });
  };
  const onComplete = (
    sender: Model,
    options: {
      showSaveInProgress: (text?: string) => void;
      showSaveSuccess: (text?: string) => void;
      showSaveError: (text?: string) => void;
    },
  ) => {
    options.showSaveInProgress();
    void actions
      .submit({ ...sender.data })
      .then(() => {
        options.showSaveSuccess();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Save failed.";
        options.showSaveError(message);
      });
  };
  model.onPartialSend.add(onPartial);
  model.onComplete.add(onComplete);
  return () => {
    model.onPartialSend.remove(onPartial);
    model.onComplete.remove(onComplete);
  };
}
