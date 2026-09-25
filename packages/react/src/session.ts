import type {
  ResponseStatus,
  SurveyJson,
  SurveyResult,
} from "@dimah-survey/core";

/**
 * Contract for the future fill hook.
 * Hydrate a survey-core Model from `definition` and `data`.
 * Do not wrap the SurveyJS renderer and do not import it from this package
 * until that hook exists.
 */
export type SurveyResponseSession = {
  responseId: string;
  definition: SurveyJson;
  data: SurveyResult;
  status: ResponseStatus;
  savePartial: (data: SurveyResult) => Promise<void>;
  submit: (data?: SurveyResult) => Promise<void>;
};
