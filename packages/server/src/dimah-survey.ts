import {
  normalizeSurveyApiBasePath,
  type GuardContext,
  type SurveyStore,
  type ValidateResultInput,
} from "@dimah-survey/core";

import { createSurveyRouter } from "./api/router";
import { surveyEndpoints } from "./api/routes";

export type DimahSurveyConfig = {
  database: SurveyStore;
  guard?: (context: GuardContext) => void | Promise<void>;
  /**
   * Required. Production passes a survey-core Model check against `definition`.
   * The memory adapter does not interpret SurveyJS JSON.
   */
  validateResult: (input: ValidateResultInput) => void | Promise<void>;
  basePath?: string;
};

export function dimahSurvey(config: DimahSurveyConfig) {
  const resolved: DimahSurveyConfig = {
    ...config,
    basePath: normalizeSurveyApiBasePath(config.basePath),
  };
  const router = createSurveyRouter(surveyEndpoints, { config: resolved });
  return {
    api: router.endpoints,
    handler: router.handler,
  };
}
