import {
  SURVEY_API_BASE_PATH,
  SURVEY_EDITOR_API_BASE_PATH,
  normalizeSurveyApiBasePath,
  type FillPrincipal,
  type GuardContext,
  type ResponseRecord,
  type SurveyStore,
  type ValidateResult,
} from "@dimah-survey/core";

import { editorSurveyEndpoints, fillSurveyEndpoints } from "./api/routes";
import { createSurveyRouter } from "./api/router";
import { checkSurveyResult } from "./validate";

export type SurveyAudience = "fill" | "editor";

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
 * write. `afterSubmit` runs after the row is stored. A replayed submit does
 * not call either hook. Both run on the fill handler, which owns submit.
 */
export type SurveyHooks = {
  onSubmit?: (context: SurveyHookContext) => void | Promise<void>;
  afterSubmit?: (context: SurveyHookContext) => void | Promise<void>;
};

type Guard = (
  context: GuardContext,
) => void | FillPrincipal | Promise<void | FillPrincipal>;

type DimahSurveyConfigBase = {
  database: SurveyStore;
  /**
   * Authorize the caller. Fill must return `{ respondentId }` or
   * `{ anonymous: true }`. Editor returns nothing, or throws to reject.
   * A fill handler with no guard is refused at startup.
   */
  guard?: Guard;
  hooks?: SurveyHooks;
  /**
   * Runs on the response snapshot. Defaults to survey-core
   * `clearIncorrectValues(true)` plus `validate`. Read on the fill handler.
   */
  validateResult?: ValidateResult;
  basePath?: string;
};

export type DimahSurveyConfig = DimahSurveyConfigBase & {
  audience: SurveyAudience;
};

export type DimahFillConfig = DimahSurveyConfigBase & {
  audience: "fill";
  guard: Guard;
};

export type DimahEditorConfig = DimahSurveyConfigBase & {
  audience: "editor";
};

type SurveyHandler = (request: Request) => Promise<Response>;

export type DimahFill = {
  api: ReturnType<
    typeof createSurveyRouter<typeof fillSurveyEndpoints>
  >["endpoints"];
  handler: SurveyHandler;
};

export type DimahEditor = {
  api: ReturnType<
    typeof createSurveyRouter<typeof editorSurveyEndpoints>
  >["endpoints"];
  handler: SurveyHandler;
};

type InstanceFor<A extends SurveyAudience> = A extends "fill"
  ? DimahFill
  : DimahEditor;

type ConfigFor<A extends SurveyAudience> = A extends "fill"
  ? DimahFillConfig
  : DimahEditorConfig;

export function dimahSurvey<A extends SurveyAudience>(
  config: ConfigFor<A> & { audience: A },
): InstanceFor<A> {
  if (config.audience === "fill" && !config.guard) {
    throw new Error('dimahSurvey({ audience: "fill" }) requires guard.');
  }
  const resolved: ResolvedDimahSurveyConfig = {
    ...config,
    basePath: normalizeSurveyApiBasePath(
      config.basePath ??
        (config.audience === "editor"
          ? SURVEY_EDITOR_API_BASE_PATH
          : SURVEY_API_BASE_PATH),
    ),
    validateResult: config.validateResult ?? checkSurveyResult,
  };
  if (config.audience === "fill") {
    const router = createSurveyRouter(fillSurveyEndpoints, {
      config: resolved,
    });
    return {
      api: router.endpoints,
      handler: router.handler,
    } as InstanceFor<A>;
  }
  const router = createSurveyRouter(editorSurveyEndpoints, {
    config: resolved,
  });
  return { api: router.endpoints, handler: router.handler } as InstanceFor<A>;
}
