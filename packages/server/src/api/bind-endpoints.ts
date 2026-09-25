import type { Endpoint } from "better-call";

import { requestFromHeaders } from "./request";
import type { SurveyEndpointContext } from "./context";

export function bindEndpoints<E extends Record<string, Endpoint>>(
  endpoints: E,
  context: Pick<SurveyEndpointContext, "config">,
): E {
  const api = {} as E;
  for (const [key, endpoint] of Object.entries(endpoints)) {
    const bound = (async (input: Record<string, unknown> = {}) => {
      const headers = input.headers as HeadersInit | undefined;
      const request =
        (input.request as Request | undefined) ?? requestFromHeaders(headers);
      return endpoint({
        ...input,
        headers: headers ?? request.headers,
        request,
        context,
      });
    }) as typeof endpoint;
    bound.path = endpoint.path;
    bound.options = endpoint.options;
    api[key as keyof E] = bound as E[keyof E];
  }
  return api;
}
