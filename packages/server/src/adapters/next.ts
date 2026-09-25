import type { DimahSurveyHandlerSource } from "./types";

export type { DimahSurveyHandlerSource };

/**
 * Adapt a dimah-survey instance to Next.js App Router route handlers.
 *
 * @example
 * ```ts
 * import { toNextJsHandler } from "@dimah-survey/server/next";
 * import { survey } from "@/lib/survey";
 *
 * export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(survey);
 * ```
 */
export function toNextJsHandler(survey: DimahSurveyHandlerSource) {
  return {
    GET: survey.handler,
    POST: survey.handler,
    PUT: survey.handler,
    PATCH: survey.handler,
    DELETE: survey.handler,
  };
}
