import { SurveyError, errorCodes } from "./errors";
import { routes } from "./routes";
import type {
  ResponseRecord,
  SurveyJson,
  SurveyRecord,
  SurveyResult,
} from "./types";

export type SurveyClient = {
  saveSurvey(input: {
    id: string;
    slug?: string;
    draftJson: SurveyJson;
    expectedUpdatedAt?: string;
  }): Promise<SurveyRecord>;
  publishSurvey(input: {
    id: string;
    expectedUpdatedAt?: string;
  }): Promise<SurveyRecord>;
  archiveSurvey(input: {
    id: string;
    expectedUpdatedAt?: string;
  }): Promise<SurveyRecord>;
  getSurvey(idOrSlug: string): Promise<SurveyRecord>;
  startResponse(input: {
    surveyId: string;
    respondentId?: string;
  }): Promise<ResponseRecord>;
  savePartial(input: {
    id: string;
    data: SurveyResult;
    expectedUpdatedAt?: string;
  }): Promise<ResponseRecord>;
  submitResponse(input: {
    id: string;
    data?: SurveyResult;
    expectedUpdatedAt?: string;
  }): Promise<ResponseRecord>;
  abandonResponse(input: {
    id: string;
    expectedUpdatedAt?: string;
  }): Promise<ResponseRecord>;
  reopenResponse(input: {
    id: string;
    expectedUpdatedAt?: string;
  }): Promise<ResponseRecord>;
  getResponse(id: string): Promise<ResponseRecord>;
};

export function createSurveyClient(options: {
  baseUrl: string;
  fetch?: typeof fetch;
}): SurveyClient {
  const base = options.baseUrl.replace(/\/$/, "");
  const fetchImpl = options.fetch ?? globalThis.fetch;

  async function send<T>(
    path: string,
    method: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetchImpl(base + path, {
      method,
      headers:
        body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = (await response.json()) as {
      code?: string;
      message?: string;
    };
    if (!response.ok) {
      const code =
        payload.code && isErrorCode(payload.code)
          ? payload.code
          : errorCodes.REQUEST_FAILED;
      throw new SurveyError(
        code,
        payload.message ?? response.statusText,
        response.status,
      );
    }
    return payload as T;
  }

  return {
    saveSurvey: ({ id, ...body }) => send(routes.survey(id), "PUT", body),
    publishSurvey: ({ id, ...body }) => send(routes.publish(id), "POST", body),
    archiveSurvey: ({ id, ...body }) => send(routes.archive(id), "POST", body),
    getSurvey: (idOrSlug) => send(routes.survey(idOrSlug), "GET"),
    startResponse: ({ surveyId, ...body }) =>
      send(routes.responses(surveyId), "POST", body),
    savePartial: ({ id, ...body }) => send(routes.response(id), "PATCH", body),
    submitResponse: ({ id, ...body }) => send(routes.submit(id), "POST", body),
    abandonResponse: ({ id, ...body }) =>
      send(routes.abandon(id), "POST", body),
    reopenResponse: ({ id, ...body }) => send(routes.reopen(id), "POST", body),
    getResponse: (id) => send(routes.response(id), "GET"),
  };
}

function isErrorCode(code: string): code is SurveyError["code"] {
  return Object.values(errorCodes).includes(code as SurveyError["code"]);
}
