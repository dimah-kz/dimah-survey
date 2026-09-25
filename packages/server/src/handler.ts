import {
  SurveyError,
  concurrencyBodySchema,
  errorCodes,
  parseBody,
  savePartialBodySchema,
  saveSurveyBodySchema,
  startResponseBodySchema,
  submitResponseBodySchema,
} from "@dimah-survey/core";
import type { DimahSurveyApi } from "./instance";

export function createHandler(api: DimahSurveyApi, basePath: string) {
  return async function handler(request: Request): Promise<Response> {
    try {
      const segments = splitPath(new URL(request.url).pathname, basePath);
      const body = await readBody(request);
      return json(await dispatch(api, request, segments, body));
    } catch (error) {
      if (error instanceof SurveyError) {
        return json({ code: error.code, message: error.message }, error.status);
      }
      const message =
        error instanceof Error ? error.message : "Request failed.";
      return json({ code: errorCodes.REQUEST_FAILED, message }, 500);
    }
  };
}

async function dispatch(
  api: DimahSurveyApi,
  request: Request,
  segments: string[],
  body: unknown,
) {
  const method = request.method.toUpperCase();
  const [root, id, action] = segments;
  if (!root || !id || segments.length > 3) {
    throw new SurveyError(
      errorCodes.REQUEST_FAILED,
      "Route was not found.",
      404,
    );
  }

  if (root === "surveys" && !action && method === "GET") {
    return api.getSurvey(id, request);
  }
  if (root === "surveys" && !action && method === "PUT") {
    const parsed = parseBody(saveSurveyBodySchema, body);
    return api.saveSurvey({ id, ...parsed }, request);
  }
  if (root === "surveys" && action === "publish" && method === "POST") {
    const parsed = parseBody(concurrencyBodySchema, body ?? {});
    return api.publishSurvey({ id, ...parsed }, request);
  }
  if (root === "surveys" && action === "archive" && method === "POST") {
    const parsed = parseBody(concurrencyBodySchema, body ?? {});
    return api.archiveSurvey({ id, ...parsed }, request);
  }
  if (root === "surveys" && action === "responses" && method === "POST") {
    const parsed = parseBody(startResponseBodySchema, body ?? {});
    return api.startResponse({ surveyId: id, ...parsed }, request);
  }
  if (root === "responses" && !action && method === "GET") {
    return api.getResponse(id, request);
  }
  if (root === "responses" && !action && method === "PATCH") {
    const parsed = parseBody(savePartialBodySchema, body);
    return api.savePartial({ id, ...parsed }, request);
  }
  if (root === "responses" && action === "submit" && method === "POST") {
    const parsed = parseBody(submitResponseBodySchema, body ?? {});
    return api.submitResponse({ id, ...parsed }, request);
  }
  if (root === "responses" && action === "abandon" && method === "POST") {
    const parsed = parseBody(concurrencyBodySchema, body ?? {});
    return api.abandonResponse({ id, ...parsed }, request);
  }
  if (root === "responses" && action === "reopen" && method === "POST") {
    const parsed = parseBody(concurrencyBodySchema, body ?? {});
    return api.reopenResponse({ id, ...parsed }, request);
  }

  throw new SurveyError(errorCodes.REQUEST_FAILED, "Route was not found.", 404);
}

async function readBody(request: Request) {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const text = await request.text();
  if (text.length === 0) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new SurveyError(
      errorCodes.INVALID_BODY,
      "Request body is not JSON.",
      400,
    );
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function splitPath(pathname: string, basePath: string) {
  const base = basePath.replace(/\/$/, "");
  if (base && pathname !== base && !pathname.startsWith(`${base}/`)) return [];
  const rest = base ? pathname.slice(base.length) : pathname;
  return rest.split("/").filter(Boolean).map(decodeURIComponent);
}
