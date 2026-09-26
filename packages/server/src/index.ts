export { dimahSurvey } from "./dimah-survey";
export type {
  DimahEditor,
  DimahEditorConfig,
  DimahFill,
  DimahFillConfig,
  DimahSurveyConfig,
  SurveyAudience,
  SurveyHookContext,
  SurveyHooks,
} from "./dimah-survey";
export { checkSurveyResult } from "./validate";
export { guardAnonymous, guardRespondent } from "./respondent";
export { memoryAdapter } from "./memory";
export type {
  AnonymousPrincipal,
  FillPrincipal,
  SurveyPrincipal,
} from "@dimah-survey/core";
export {
  APIError,
  SURVEY_API_BASE_PATH,
  SURVEY_EDITOR_API_BASE_PATH,
  SURVEY_ERROR_CODES,
  createEditorClient,
  createFillClient,
  isAPIError,
} from "@dimah-survey/core";
export type {
  EditorClient,
  FillClient,
  ResponseRecord,
  SurveyClient,
  SurveyJson,
  SurveyRecord,
  SurveyResult,
  SurveyStore,
} from "@dimah-survey/core";
