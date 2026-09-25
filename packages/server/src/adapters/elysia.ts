import type { DimahSurveyHandlerSource } from "./types";

/** Structural Elysia context — avoids a hard dependency on `elysia`. */
type ElysiaContext = {
  request: Request;
};

/**
 * Adapt a dimah-survey instance to an Elysia route handler.
 *
 * @example
 * ```ts
 * import { Elysia } from "elysia";
 * import { toElysiaHandler } from "@dimah-survey/server/elysia";
 * import { survey } from "./survey";
 *
 * new Elysia()
 *   .all("/api/survey/*", toElysiaHandler(survey))
 *   .listen(3000);
 * ```
 */
export function toElysiaHandler(survey: DimahSurveyHandlerSource) {
  return (ctx: ElysiaContext) => survey.handler(ctx.request);
}
