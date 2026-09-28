export const SURVEY_API_BASE_PATH = "/api/survey";

/** Default mount for `audience: "editor"`. Fill stays on `SURVEY_API_BASE_PATH`. */
export const SURVEY_EDITOR_API_BASE_PATH = "/api/admin/survey";

const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:/i;

export function normalizeSurveyApiBasePath(basePath = SURVEY_API_BASE_PATH) {
  const trimmed = basePath.trim() || SURVEY_API_BASE_PATH;
  let end = trimmed.length;
  while (end > 0 && trimmed[end - 1] === "/") end -= 1;
  const stripped = trimmed.slice(0, end) || SURVEY_API_BASE_PATH;
  if (ABSOLUTE_URL.test(stripped)) return stripped;
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

export const SURVEY_API_ROUTES = {
  survey: "/survey",
  surveys: "/surveys",
  publishSurvey: "/survey/publish",
  archiveSurvey: "/survey/archive",
  surveySettings: "/survey/settings",
  resumeSurvey: "/survey/resume",
  publishedSurvey: "/survey/published",
  surveyVersions: "/survey/versions",
  startResponse: "/response/start",
  response: "/response",
  responses: "/responses",
  savePartial: "/response/partial",
  submitResponse: "/response/submit",
  abandonResponse: "/response/abandon",
  reopenResponse: "/response/reopen",
} as const;

export const SURVEY_API_OPERATIONS = {
  getSurvey: { method: "GET", path: SURVEY_API_ROUTES.survey },
  saveSurvey: { method: "POST", path: SURVEY_API_ROUTES.survey },
  listSurveys: { method: "GET", path: SURVEY_API_ROUTES.surveys },
  publishSurvey: { method: "POST", path: SURVEY_API_ROUTES.publishSurvey },
  archiveSurvey: { method: "POST", path: SURVEY_API_ROUTES.archiveSurvey },
  saveSurveySettings: {
    method: "POST",
    path: SURVEY_API_ROUTES.surveySettings,
  },
  resumeSurvey: { method: "POST", path: SURVEY_API_ROUTES.resumeSurvey },
  getPublishedSurvey: {
    method: "GET",
    path: SURVEY_API_ROUTES.publishedSurvey,
  },
  listSurveyVersions: {
    method: "GET",
    path: SURVEY_API_ROUTES.surveyVersions,
  },
  startResponse: { method: "POST", path: SURVEY_API_ROUTES.startResponse },
  getResponse: { method: "GET", path: SURVEY_API_ROUTES.response },
  listResponses: { method: "GET", path: SURVEY_API_ROUTES.responses },
  savePartial: { method: "POST", path: SURVEY_API_ROUTES.savePartial },
  submitResponse: { method: "POST", path: SURVEY_API_ROUTES.submitResponse },
  abandonResponse: { method: "POST", path: SURVEY_API_ROUTES.abandonResponse },
  reopenResponse: { method: "POST", path: SURVEY_API_ROUTES.reopenResponse },
} as const;

export type SurveyApiOperation = keyof typeof SURVEY_API_OPERATIONS;

/** Routes mounted by `audience: "fill"`. Editor survey routes are absent. */
export const FILL_AUDIENCE_OPERATIONS = [
  "getPublishedSurvey",
  "startResponse",
  "getResponse",
  "listResponses",
  "savePartial",
  "submitResponse",
  "abandonResponse",
  "reopenResponse",
] as const satisfies readonly SurveyApiOperation[];

/** Routes mounted by `audience: "editor"`. Fill writes are absent. */
export const EDITOR_AUDIENCE_OPERATIONS = [
  "getSurvey",
  "saveSurvey",
  "listSurveys",
  "publishSurvey",
  "archiveSurvey",
  "saveSurveySettings",
  "resumeSurvey",
  "listSurveyVersions",
  "getResponse",
  "listResponses",
] as const satisfies readonly SurveyApiOperation[];

export type FillAudienceOperation = (typeof FILL_AUDIENCE_OPERATIONS)[number];

export type EditorAudienceOperation =
  (typeof EDITOR_AUDIENCE_OPERATIONS)[number];

export function surveyApiRouteKey(method: string, path: string) {
  return `${method} ${path}`;
}

export const SURVEY_API_ROUTE_KEYS = Object.fromEntries(
  Object.entries(SURVEY_API_OPERATIONS).map(([operation, spec]) => [
    surveyApiRouteKey(spec.method, spec.path),
    operation,
  ]),
) as Record<string, SurveyApiOperation>;
