import { SURVEY_API_ROUTE_KEYS, surveyApiRouteKey } from "@dimah-survey/core";
import { createEndpoint, type EndpointOptions } from "better-call";
import * as z from "zod";

import { errors } from "@/errors";
import { surveyContextMiddleware } from "./middleware";

const createEndpointWithContext = createEndpoint.create({
  use: [surveyContextMiddleware],
});

function compileIfZod<T>(schema: T): T {
  if (schema !== null && typeof schema === "object" && "_zod" in schema) {
    return z.compile(schema as unknown as z.ZodType) as T;
  }
  return schema;
}

function withValidation<O extends EndpointOptions>(options: O): O {
  return {
    ...options,
    ...(options.body !== undefined ? { body: compileIfZod(options.body) } : {}),
    ...(options.query !== undefined
      ? { query: compileIfZod(options.query) }
      : {}),
    onValidationError:
      options.onValidationError ??
      (({ message }: { message: string }) => {
        throw errors.validationError(message);
      }),
  };
}

type CreateSurveyEndpoint = typeof createEndpointWithContext;

export const createSurveyEndpoint: CreateSurveyEndpoint = ((
  pathOrOptions: string | EndpointOptions,
  optionsOrHandler: EndpointOptions | ((...args: never[]) => unknown),
  maybeHandler?: (...args: never[]) => unknown,
) => {
  const path = typeof pathOrOptions === "string" ? pathOrOptions : "";
  const options = (
    typeof pathOrOptions === "string" ? optionsOrHandler : pathOrOptions
  ) as EndpointOptions;
  const handler = (
    typeof pathOrOptions === "string" ? maybeHandler : optionsOrHandler
  ) as (...args: never[]) => unknown;
  const method = String(options.method ?? "GET");
  const operation =
    SURVEY_API_ROUTE_KEYS[surveyApiRouteKey(method, path)] ?? "getSurvey";

  return createEndpointWithContext(
    path,
    withValidation(options),
    async (ctx) => {
      await ctx.context.config.guard?.({
        request: ctx.context.request,
        operation,
      });
      return handler(ctx as never);
    },
  );
}) as unknown as CreateSurveyEndpoint;
