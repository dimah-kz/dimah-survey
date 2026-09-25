import { createSurveyFetch, type SurveyClientFetchOptions } from "./fetch";
import { normalizeSurveyApiBasePath, SURVEY_API_ROUTES } from "./routes";
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
  getSurvey(id: string): Promise<SurveyRecord>;
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

export function createSurveyClient(
  options: SurveyClientFetchOptions & { baseURL?: string } = {},
): SurveyClient {
  const { baseURL, ...fetchOptions } = options;
  const $fetch = createSurveyFetch(
    normalizeSurveyApiBasePath(baseURL),
    fetchOptions,
  );

  return {
    saveSurvey: (body) =>
      $fetch(SURVEY_API_ROUTES.survey, { method: "POST", body }),
    publishSurvey: (body) =>
      $fetch(SURVEY_API_ROUTES.publishSurvey, { method: "POST", body }),
    archiveSurvey: (body) =>
      $fetch(SURVEY_API_ROUTES.archiveSurvey, { method: "POST", body }),
    getSurvey: (id) =>
      $fetch(SURVEY_API_ROUTES.survey, { method: "GET", query: { id } }),
    startResponse: (body) =>
      $fetch(SURVEY_API_ROUTES.startResponse, { method: "POST", body }),
    savePartial: (body) =>
      $fetch(SURVEY_API_ROUTES.savePartial, { method: "POST", body }),
    submitResponse: (body) =>
      $fetch(SURVEY_API_ROUTES.submitResponse, { method: "POST", body }),
    abandonResponse: (body) =>
      $fetch(SURVEY_API_ROUTES.abandonResponse, { method: "POST", body }),
    reopenResponse: (body) =>
      $fetch(SURVEY_API_ROUTES.reopenResponse, { method: "POST", body }),
    getResponse: (id) =>
      $fetch(SURVEY_API_ROUTES.response, { method: "GET", query: { id } }),
  };
}
