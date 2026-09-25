import { fromNodeHeaders, toNodeHandler } from "./node";
import type { DimahSurveyHandlerSource } from "./types";

export { fromNodeHeaders };

/**
 * Adapt a dimah-survey instance to an Express / Connect handler.
 *
 * Mount **before** `express.json()` so the request body is not consumed early.
 *
 * @example
 * ```ts
 * import express from "express";
 * import { toExpressHandler } from "@dimah-survey/server/express";
 * import { survey } from "./survey";
 *
 * const app = express();
 * app.all("/api/survey/*", toExpressHandler(survey));
 * app.use(express.json());
 * ```
 */
export function toExpressHandler(survey: DimahSurveyHandlerSource) {
  return toNodeHandler(survey);
}
