import type { SurveyResult } from "@dimah-survey/core";
import type { Model } from "survey-core";

export type SurveyModelActions = {
  savePartial: (data: SurveyResult) => Promise<void>;
  submit: (data: SurveyResult) => Promise<void>;
  /** Partial save or submit failed. The Model stays on the page. */
  onWriteError?: (error: unknown) => void;
};

export type SurveyPartialSend = "page" | "off";

export type SurveyModelBindOptions = {
  /** `"page"` saves on page next. `"off"` saves only on complete. */
  partial?: SurveyPartialSend;
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
 * File bytes stay on the app's `onUploadFiles` handler. `data` stores the locator.
 */
export function bindSurveyModel(
  model: Model,
  actions: SurveyModelActions,
  options?: SurveyModelBindOptions,
) {
  const partial = options?.partial ?? "page";
  // SurveyJS 2 reads `sendResultOnPageNext`. SurveyJS 3 reads `partialSendEnabled`.
  model.sendResultOnPageNext = partial === "page";
  model.partialSendEnabled = partial === "page";
  const onQuestionAdded = (
    _sender: Model,
    event: { question: { getType(): string } },
  ) => {
    storeFilesAsUrls(event.question);
  };
  for (const question of model.getAllQuestions()) storeFilesAsUrls(question);
  model.onQuestionAdded.add(onQuestionAdded);
  const onPartial = () => {
    void actions.savePartial({ ...model.data }).catch((error: unknown) => {
      actions.onWriteError?.(error);
    });
  };
  const onCompleting = async (sender: Model, completing: CompletingOptions) => {
    try {
      await actions.submit({ ...sender.data });
    } catch (error: unknown) {
      completing.allow = false;
      completing.allowComplete = false;
      completing.message =
        error instanceof Error ? error.message : "Save failed.";
      actions.onWriteError?.(error);
    }
  };
  if (partial === "page") model.onPartialSend.add(onPartial);
  model.onCompleting.add(onCompleting);
  return () => {
    model.onQuestionAdded.remove(onQuestionAdded);
    if (partial === "page") model.onPartialSend.remove(onPartial);
    model.onCompleting.remove(onCompleting);
  };
}

/** File and signature answers stay URLs. The app handles the bytes. */
function storeFilesAsUrls(question: { getType(): string }) {
  const type = question.getType();
  if (type !== "file" && type !== "signaturepad") return;
  (question as { storeDataAsText?: boolean }).storeDataAsText = false;
}
