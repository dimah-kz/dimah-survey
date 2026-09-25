import {
  APIError,
  SURVEY_ERROR_CODES,
  type SurveyJson,
  type SurveyResult,
  type ValidateResultInput,
} from "@dimah-survey/core";
import { Model } from "survey-core";

/**
 * SurveyJS server check: drop values that cannot be assigned, then validate
 * the snapshot. The returned object is the `survey.data` to persist.
 */
export function checkSurveyResult(input: ValidateResultInput): SurveyResult {
  const survey = new Model(input.definition as SurveyJson);
  survey.data = input.data;
  survey.clearIncorrectValues(true);
  if (!survey.validate(true, false)) {
    const questions = survey
      .getAllQuestions()
      .filter((question) => question.errors.length > 0)
      .map((question) => question.name);
    throw APIError.from("BAD_REQUEST", {
      code: SURVEY_ERROR_CODES.VALIDATION_FAILED.code,
      message:
        questions.length > 0
          ? `Survey result is invalid: ${questions.join(", ")}`
          : SURVEY_ERROR_CODES.VALIDATION_FAILED.message,
    });
  }
  return { ...survey.data };
}
