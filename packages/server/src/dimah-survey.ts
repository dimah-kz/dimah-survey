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
  guard?: SurveyGuard;
  hooks?: FillHooks | EditorHooks;
  validateResult: ValidateResult;
  basePath: string;
  sanitizePartial: SanitizePartial;
};

/** `onSubmit` and `afterSubmit` argument. `afterStart` receives this too. */
export type SurveyHookContext = {
  /** Present for HTTP calls. Absent for in-process calls without a request. */
  request?: Request;
  response: ResponseRecord;
};

/** `onStart` argument. Runs only before a new insert. */
export type SurveyStartContext = {
  /** Present for HTTP calls. Absent for in-process calls without a request. */
  request?: Request;
  /** Survey the response is about to start from. */
  survey: SurveyRecord;
};

/** `onPublish` and `afterPublish` argument. */
export type SurveyPublishContext = {
  /** Present for HTTP calls. Absent for in-process calls without a request. */
  request?: Request;
  /** Survey whose `draftJson` is being promoted. */
  survey: SurveyRecord;
};

/**
 * Fill lifecycle hooks.
 * `on*` throwing aborts the write. `after*` throwing leaves the row stored.
 * A resumed start and a replayed submit skip these hooks.
 */
export type FillHooks = {
  /** Inside the store lock, before a new insert. */
  onStart?: (context: SurveyStartContext) => void | Promise<void>;
  /** After the insert, still inside the lock. A throw leaves the row stored. */
  afterStart?: (context: SurveyHookContext) => void | Promise<void>;
  /** After validation, before the submitted write. */
  onSubmit?: (context: SurveyHookContext) => void | Promise<void>;
  /** After the submitted row is stored. A throw leaves the row stored. */
  afterSubmit?: (context: SurveyHookContext) => void | Promise<void>;
};

/**
 * Editor lifecycle hooks.
 * `onPublish` throwing aborts the write. `afterPublish` throwing leaves the
 * row stored. `resumeSurvey` does not call either hook.
 */
export type EditorHooks = {
  /** Before `draftJson` is copied onto `publishedJson`. */
  onPublish?: (context: SurveyPublishContext) => void | Promise<void>;
  /** After the published row is stored. A throw leaves the row stored. */
  afterPublish?: (context: SurveyPublishContext) => void | Promise<void>;
};

/**
 * How partial save treats values the snapshot cannot keep.
 * `"clear"` runs `clearIncorrectValues(true)` and skips `validate`.
 * `"replace"` stores the payload as sent.
 */
export type SanitizePartial = "clear" | "replace";

/**
 * Authorize one request.
 * Fill must return `{ respondentId }` or `{ anonymous: true }`.
 * Editor returns nothing. Throw to reject.
 */
export type SurveyGuard = (
  context: GuardContext,
) => void | FillPrincipal | Promise<void | FillPrincipal>;

type DimahSurveyConfigBase = {
  /** Shared `SurveyStore`. Fill and editor must use the same instance. */
  database: SurveyStore;
  /**
   * Authorize the caller, or throw.
   * Fill returns `{ respondentId }` or `{ anonymous: true }`.
   * Editor returns nothing. A returned principal is invalid.
   */
  guard?: SurveyGuard;
  /**
   * HTTP path prefix. Must match the browser client's `baseURL`.
   * Fill defaults to `/api/survey`. Editor defaults to `/api/admin/survey`.
   */
  basePath?: string;
};

/** `dimahSurvey({ audience: "fill" })` options. `guard` is required. */
export type DimahFillConfig = DimahSurveyConfigBase & {
  /** Must be `"fill"`. */
  audience: "fill";
  guard: SurveyGuard;
  /** `onStart`, `afterStart`, `onSubmit`, and `afterSubmit`. */
  hooks?: FillHooks;
  /**
   * How a partial save treats values the snapshot rejects.
   * @default "clear"
   */
  sanitizePartial?: SanitizePartial;
  /**
   * Validate and normalize submit data against the response snapshot.
   * @default checkSurveyResult
   */
  validateResult?: ValidateResult;
};

/** `dimahSurvey({ audience: "editor" })` options. */
export type DimahEditorConfig = DimahSurveyConfigBase & {
  /** Must be `"editor"`. */
  audience: "editor";
  /** `onPublish` and `afterPublish`. `resumeSurvey` does not call them. */
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

function sanitizePartialOf(config: DimahSurveyConfig): SanitizePartial {
  if (config.audience === "fill") return config.sanitizePartial ?? "clear";
  return "replace";
}

function validateResultOf(config: DimahSurveyConfig): ValidateResult {
  if (config.audience === "fill") {
    return config.validateResult ?? checkSurveyResult;
  }
  return checkSurveyResult;
}

type InstanceFor<A extends SurveyAudience> = A extends "fill"
  ? DimahFill
  : DimahEditor;

type ConfigFor<A extends SurveyAudience> = A extends "fill"
  ? DimahFillConfig
  : DimahEditorConfig;

/**
 * Create a fill or editor server.
 *
 * Pass the same `database` to both. Fill requires `guard` and owns response
 * writes. Editor owns drafts, publish, and analytics reads.
 */
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
    validateResult: validateResultOf(config),
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
