import {
  normalizeSurveyApiBasePath,
  type GuardContext,
  type ResponseRecord,
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

export type SurveyHookContext = {
  request?: Request;
  response: ResponseRecord;
};

/**
 * `onSubmit` runs after validation and before persist. Throwing aborts the
 * write. `afterSubmit` runs after the row is stored.
 */
export type SurveyHooks = {
  onSubmit?: (context: SurveyHookContext) => void | Promise<void>;
  afterSubmit?: (context: SurveyHookContext) => void | Promise<void>;
};

export type DimahSurveyConfig = {
  database: SurveyStore;
  guard?: (context: GuardContext) => void | Promise<void>;
  hooks?: SurveyHooks;
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
