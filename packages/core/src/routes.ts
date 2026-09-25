export const SURVEY_API_BASE_PATH = "/api/survey";

const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:/i;

export function normalizeSurveyApiBasePath(basePath = SURVEY_API_BASE_PATH) {
  const trimmed = basePath.trim() || SURVEY_API_BASE_PATH;
  const stripped = trimmed.replace(/\/+$/, "") || SURVEY_API_BASE_PATH;
  if (ABSOLUTE_URL.test(stripped)) return stripped;
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

export const SURVEY_API_ROUTES = {
  survey: "/survey",
  surveys: "/surveys",
  publishSurvey: "/survey/publish",
  archiveSurvey: "/survey/archive",
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
  startResponse: { method: "POST", path: SURVEY_API_ROUTES.startResponse },
  getResponse: { method: "GET", path: SURVEY_API_ROUTES.response },
  listResponses: { method: "GET", path: SURVEY_API_ROUTES.responses },
  savePartial: { method: "POST", path: SURVEY_API_ROUTES.savePartial },
  submitResponse: { method: "POST", path: SURVEY_API_ROUTES.submitResponse },
  abandonResponse: { method: "POST", path: SURVEY_API_ROUTES.abandonResponse },
  reopenResponse: { method: "POST", path: SURVEY_API_ROUTES.reopenResponse },
} as const;

export type SurveyApiOperation = keyof typeof SURVEY_API_OPERATIONS;

export function surveyApiRouteKey(method: string, path: string) {
  return `${method} ${path}`;
}

export const SURVEY_API_ROUTE_KEYS = Object.fromEntries(
  Object.entries(SURVEY_API_OPERATIONS).map(([operation, spec]) => [
    surveyApiRouteKey(spec.method, spec.path),
    operation,
  ]),
) as Record<string, SurveyApiOperation>;
