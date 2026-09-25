import {
  normalizeSurveyApiBasePath,
  type GuardContext,
  type SurveyStore,
  type ValidateResult,
} from "@dimah-survey/core";

import { checkSurveyResult } from "./validate";

import { createSurveyRouter } from "./api/router";
import { surveyEndpoints } from "./api/routes";

export type ResolvedDimahSurveyConfig = Omit<
  DimahSurveyConfig,
  "validateResult" | "basePath"
> & {
  validateResult: ValidateResult;
  basePath: string;
};

export type DimahSurveyConfig = {
  database: SurveyStore;
  guard?: (context: GuardContext) => void | Promise<void>;
  /**
   * Runs on the response snapshot. Defaults to survey-core
   * `clearIncorrectValues(true)` plus `validate`.
   */
  validateResult?: ValidateResult;
  basePath?: string;
};

export function dimahSurvey(config: DimahSurveyConfig) {
  const resolved: ResolvedDimahSurveyConfig = {
    ...config,
    basePath: normalizeSurveyApiBasePath(config.basePath),
    validateResult: config.validateResult ?? checkSurveyResult,
  };
  const router = createSurveyRouter(surveyEndpoints, { config: resolved });
  return {
    api: router.endpoints,
    handler: router.handler,
  };
}
