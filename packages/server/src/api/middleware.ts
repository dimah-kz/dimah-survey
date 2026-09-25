import { createMiddleware } from "better-call";

import { requestFromHeaders } from "./request";
import type { SurveyEndpointContext } from "./context";

export const surveyContextMiddleware = createMiddleware(async (ctx) => {
  const injected = ctx.context as Partial<SurveyEndpointContext> | undefined;
  if (!injected?.config) {
    throw new Error(
      "createSurveyEndpoint requires dimahSurvey router context. Call endpoints through dimahSurvey().api or the HTTP handler.",
    );
  }
  const request =
    ctx.request ?? injected.request ?? requestFromHeaders(ctx.headers);
  return { config: injected.config, request } satisfies SurveyEndpointContext;
});
