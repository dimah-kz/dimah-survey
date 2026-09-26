import { createSurveyFetch, type SurveyClientFetchOptions } from "./fetch";
import { normalizeSurveyApiBasePath, SURVEY_API_ROUTES } from "./routes";
import type {
  ArchiveSurveyInput,
  ListResponsesQuery,
  ListSurveysQuery,
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
  | "listResponses"
  | "getResponse"
>;

function createSurveyClient(
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

export function createFillClient(
  options: SurveyClientFetchOptions & { baseURL?: string } = {},
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

export function createEditorClient(
  options: SurveyClientFetchOptions & { baseURL?: string } = {},
): EditorClient {
  const client = createSurveyClient(options);
  return {
    saveSurvey: client.saveSurvey,
    publishSurvey: client.publishSurvey,
    archiveSurvey: client.archiveSurvey,
    saveSurveySettings: client.saveSurveySettings,
    resumeSurvey: client.resumeSurvey,
    getSurvey: client.getSurvey,
    listSurveys: client.listSurveys,
    listResponses: client.listResponses,
    getResponse: client.getResponse,
  };
}
