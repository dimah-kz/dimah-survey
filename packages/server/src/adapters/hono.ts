import type { DimahSurveyHandlerSource } from "./types";

/** Structural Hono context — avoids a hard dependency on `hono`. */
type HonoContext = {
  req: { raw: Request };
};

/**
 * Adapt a dimah-survey instance to a Hono route handler.
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { toHonoHandler } from "@dimah-survey/server/hono";
 * import { survey } from "./survey";
 *
 * const app = new Hono();
 * app.on(["GET", "POST", "PUT", "PATCH", "DELETE"], "/api/survey/*", toHonoHandler(survey));
 * ```
 */
export function toHonoHandler(survey: DimahSurveyHandlerSource) {
  return (c: HonoContext) => survey.handler(c.req.raw);
}
