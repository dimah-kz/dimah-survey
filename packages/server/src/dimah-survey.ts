import {
  SURVEY_API_BASE_PATH,
  SURVEY_EDITOR_API_BASE_PATH,
  normalizeSurveyApiBasePath,
  type FillPrincipal,
  type GuardContext,
  type ResponseRecord,
  type SurveyRecord,
  type SurveyStore,
  type ValidateResult,
} from "@dimah-survey/core";

import { editorSurveyEndpoints, fillSurveyEndpoints } from "./api/routes";
import { createSurveyRouter } from "./api/router";
import { checkSurveyResult } from "./validate";

export type SurveyAudience = "fill" | "editor";

export type ResolvedDimahSurveyConfig = {
  audience: SurveyAudience;
  database: SurveyStore;
  guard?: Guard;
  hooks?: FillHooks | EditorHooks;
  validateResult: ValidateResult;
  basePath: string;
  sanitizePartial: SanitizePartial;
};

export type SurveyHookContext = {
  request?: Request;
  response: ResponseRecord;
};

export type SurveyStartContext = {
  request?: Request;
  survey: SurveyRecord;
};

export type SurveyPublishContext = {
  request?: Request;
  survey: SurveyRecord;
};

/**
 * `onSubmit` runs after validation and before persist. Throwing aborts the
 * write. `afterSubmit` runs after the row is stored. A replayed submit does
 * not call either hook. `onStart` runs only before a new insert. `afterStart`
 * runs after that insert; a throw leaves the row stored.
 */
export type FillHooks = {
  onSubmit?: (context: SurveyHookContext) => void | Promise<void>;
  afterSubmit?: (context: SurveyHookContext) => void | Promise<void>;
  onStart?: (context: SurveyStartContext) => void | Promise<void>;
  afterStart?: (context: SurveyHookContext) => void | Promise<void>;
};

/**
 * `onPublish` runs before `draftJson` is copied onto `publishedJson`.
 * Throwing aborts the write. `afterPublish` runs after the row is stored.
 * `resumeSurvey` does not call either hook.
 */
export type EditorHooks = {
  onPublish?: (context: SurveyPublishContext) => void | Promise<void>;
  afterPublish?: (context: SurveyPublishContext) => void | Promise<void>;
};

/** `"clear"` runs `clearIncorrectValues(true)` and skips `validate`. */
export type SanitizePartial = "clear" | "replace";

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
  /**
   * Runs on the response snapshot. Defaults to survey-core
   * `clearIncorrectValues(true)` plus `validate`. Read on the fill handler.
   */
  validateResult?: ValidateResult;
  basePath?: string;
};

export type DimahFillConfig = DimahSurveyConfigBase & {
  audience: "fill";
  guard: Guard;
  hooks?: FillHooks;
  /** Defaults to `"clear"`. */
  sanitizePartial?: SanitizePartial;
};

export type DimahEditorConfig = DimahSurveyConfigBase & {
  audience: "editor";
  hooks?: EditorHooks;
};

export type DimahSurveyConfig = DimahFillConfig | DimahEditorConfig;

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

function sanitizePartialOf(
  config: DimahFillConfig | DimahEditorConfig,
): SanitizePartial {
  if (config.audience === "fill") return config.sanitizePartial ?? "clear";
  return "replace";
}

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
    audience: config.audience,
    database: config.database,
    guard: config.guard,
    hooks: config.hooks,
    validateResult: config.validateResult ?? checkSurveyResult,
    sanitizePartial: sanitizePartialOf(config),
    basePath: normalizeSurveyApiBasePath(
      config.basePath ??
        (config.audience === "editor"
          ? SURVEY_EDITOR_API_BASE_PATH
          : SURVEY_API_BASE_PATH),
    ),
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
