import { createFetch, type BetterFetch } from "@better-fetch/fetch";

import { APIError } from "./error";
import { surveyFetchErrorSchema } from "./schema/error";

export type SurveyFetch = BetterFetch<{ throw: true }>;

export type SurveyClientFetchOptions = {
  fetch?: typeof fetch;
  credentials?: RequestCredentials;
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
};

function fallbackMessage(error: { statusText: string; error?: unknown }) {
  if (typeof error.error === "string" && error.error.trim()) {
    return error.error;
  }
  return error.statusText || "Request failed";
}

function apiErrorFromFetch(error: {
  status: number;
  statusText: string;
  error?: unknown;
}): APIError {
  const parsed = surveyFetchErrorSchema.safeParse(error);
  if (parsed.success) {
    return new APIError(error.status, {
      message: parsed.data.message,
      ...(parsed.data.code !== undefined ? { code: parsed.data.code } : {}),
      ...(parsed.data.questions !== undefined
        ? { questions: parsed.data.questions }
        : {}),
    });
  }
  return new APIError(error.status, { message: fallbackMessage(error) });
}

export function createSurveyFetch(
  base: string,
  options?: SurveyClientFetchOptions,
): SurveyFetch {
  return createFetch({
    baseURL: base,
    throw: true,
    errorSchema: surveyFetchErrorSchema,
    customFetchImpl: options?.fetch,
    credentials: options?.credentials,
    onRequest: async (context) => {
      const extra =
        typeof options?.headers === "function"
          ? await options.headers()
          : options?.headers;
      if (!extra) return context;
      const headers = new Headers(context.headers);
      new Headers(extra).forEach((value, key) => {
        headers.set(key, value);
      });
      return { ...context, headers };
    },
    onError: (context) => {
      throw apiErrorFromFetch(context.error);
    },
  });
}
