import { createSurveyFetch, type SurveyClientFetchOptions } from "./fetch";
import {
  normalizeSurveyApiBasePath,
  SURVEY_API_ROUTES,
  SURVEY_EDITOR_API_BASE_PATH,
} from "./routes";
import type {
  ArchiveSurveyInput,
  ListResponsesQuery,
  ListSurveysQuery,
  ListSurveyVersionsQuery,
  PublishSurveyInput,
  PublishedSurvey,
  ResponseList,
  ResponseMutationInput,
  ResponseRecord,
  ResumeSurveyInput,
  SavePartialInput,
  SaveSurveyInput,
  SaveSurveySettingsInput,
  StartResponseInput,
  SubmitResponseInput,
  SurveyList,
  SurveyRecord,
  SurveyVersionList,
} from "./types";

export type SurveyClient = {
  saveSurvey(input: SaveSurveyInput): Promise<SurveyRecord>;
  publishSurvey(input: PublishSurveyInput): Promise<SurveyRecord>;
  archiveSurvey(input: ArchiveSurveyInput): Promise<SurveyRecord>;
  saveSurveySettings(input: SaveSurveySettingsInput): Promise<SurveyRecord>;
  resumeSurvey(input: ResumeSurveyInput): Promise<SurveyRecord>;
  getSurvey(id: string): Promise<SurveyRecord>;
  getPublishedSurvey(id: string): Promise<PublishedSurvey>;
  listSurveys(input?: ListSurveysQuery): Promise<SurveyList>;
  listSurveyVersions(
    input: ListSurveyVersionsQuery,
  ): Promise<SurveyVersionList>;
  startResponse(input: StartResponseInput): Promise<ResponseRecord>;
  listResponses(input?: ListResponsesQuery): Promise<ResponseList>;
  savePartial(input: SavePartialInput): Promise<ResponseRecord>;
  submitResponse(input: SubmitResponseInput): Promise<ResponseRecord>;
  abandonResponse(input: ResponseMutationInput): Promise<ResponseRecord>;
  reopenResponse(input: ResponseMutationInput): Promise<ResponseRecord>;
  getResponse(id: string): Promise<ResponseRecord>;
};

export type FillClient = Pick<
  SurveyClient,
  | "getPublishedSurvey"
  | "startResponse"
  | "listResponses"
  | "savePartial"
  | "submitResponse"
  | "abandonResponse"
  | "reopenResponse"
  | "getResponse"
>;

export type EditorClient = Pick<
  SurveyClient,
  | "saveSurvey"
  | "publishSurvey"
  | "archiveSurvey"
  | "saveSurveySettings"
  | "resumeSurvey"
  | "getSurvey"
  | "listSurveys"
  | "listSurveyVersions"
  | "listResponses"
  | "getResponse"
>;

/** Options for `createFillClient` and `createEditorClient`. */
export type CreateSurveyClientOptions = SurveyClientFetchOptions & {
  /**
   * Must match the server `basePath`.
   * Fill defaults to `/api/survey`. Editor defaults to `/api/admin/survey`.
   */
  baseURL?: string;
};

function createSurveyClient(
  options: CreateSurveyClientOptions = {},
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
    saveSurveySettings: (body) =>
      $fetch(SURVEY_API_ROUTES.surveySettings, { method: "POST", body }),
    resumeSurvey: (body) =>
      $fetch(SURVEY_API_ROUTES.resumeSurvey, { method: "POST", body }),
    getSurvey: (id) =>
      $fetch(SURVEY_API_ROUTES.survey, { method: "GET", query: { id } }),
    getPublishedSurvey: (id) =>
      $fetch(SURVEY_API_ROUTES.publishedSurvey, {
        method: "GET",
        query: { id },
      }),
    listSurveys: (query) =>
      $fetch(SURVEY_API_ROUTES.surveys, { method: "GET", query }),
    listSurveyVersions: (query) =>
      $fetch(SURVEY_API_ROUTES.surveyVersions, { method: "GET", query }),
    startResponse: (body) =>
      $fetch(SURVEY_API_ROUTES.startResponse, { method: "POST", body }),
    listResponses: (query) =>
      $fetch(SURVEY_API_ROUTES.responses, { method: "GET", query }),
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

/** Fill audience client. `baseURL` defaults to `/api/survey`. */
export function createFillClient(
  options: CreateSurveyClientOptions = {},
): FillClient {
  const client = createSurveyClient(options);
  return {
    getPublishedSurvey: client.getPublishedSurvey,
    startResponse: client.startResponse,
    listResponses: client.listResponses,
    savePartial: client.savePartial,
    submitResponse: client.submitResponse,
    abandonResponse: client.abandonResponse,
    reopenResponse: client.reopenResponse,
    getResponse: client.getResponse,
  };
}

/** Editor audience client. `baseURL` defaults to `/api/admin/survey`. */
export function createEditorClient(
  options: CreateSurveyClientOptions = {},
): EditorClient {
  const client = createSurveyClient({
    ...options,
    baseURL: options.baseURL ?? SURVEY_EDITOR_API_BASE_PATH,
  });
  return {
    saveSurvey: client.saveSurvey,
    publishSurvey: client.publishSurvey,
    archiveSurvey: client.archiveSurvey,
    saveSurveySettings: client.saveSurveySettings,
    resumeSurvey: client.resumeSurvey,
    getSurvey: client.getSurvey,
    listSurveys: client.listSurveys,
    listSurveyVersions: client.listSurveyVersions,
    listResponses: client.listResponses,
    getResponse: client.getResponse,
  };
}
