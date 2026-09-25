import {
  isAPIError,
  normalizeSurveyApiBasePath,
  SURVEY_API_BASE_PATH,
} from "@dimah-survey/core";
import { createRouter, toResponse, type Endpoint } from "better-call";

import type { DimahSurveyConfig } from "@/dimah-survey";
import { errors } from "@/errors";
import { bindEndpoints } from "./bind-endpoints";

function onSurveyRouterError(error: unknown): void {
  if (isAPIError(error)) return;
  throw errors.internalError();
}

function withUnmatchedRouteJson(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const response = await handler(request);
    if (response.status !== 404) return response;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) return response;
    return toResponse(errors.notFound());
  };
}

export function createSurveyRouter<E extends Record<string, Endpoint>>(
  endpoints: E,
  env: { config: DimahSurveyConfig },
) {
  const router = createRouter(endpoints, {
    basePath: normalizeSurveyApiBasePath(
      env.config.basePath ?? SURVEY_API_BASE_PATH,
    ),
    routerContext: { config: env.config },
    openapi: { disabled: true },
    onError: onSurveyRouterError,
  });

  return {
    endpoints: bindEndpoints(router.endpoints, { config: env.config }),
    handler: withUnmatchedRouteJson(router.handler),
  };
}
