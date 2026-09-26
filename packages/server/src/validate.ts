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
 * Answers for questions that load `choicesByUrl` are kept; the server does
 * not fetch that list.
 */
export function checkSurveyResult(input: ValidateResultInput): SurveyResult {
  const survey = clearedModel(input);
  if (!survey.validate(true, false)) {
    const questions = survey
      .getAllQuestions()
      .filter((question) => question.errors.length > 0)
      .map((question) => question.name);
    throw validationFailed(questions);
  }
  return { ...survey.data };
}

/** `clearIncorrectValues(true)` without `validate`. Required questions may stay empty. */
export function clearSurveyResult(input: ValidateResultInput): SurveyResult {
  return { ...clearedModel(input).data };
}

function clearedModel(input: ValidateResultInput) {
  const preserved = preservedChoicesByUrl(input.definition, input.data);
  const survey = new Model(input.definition as SurveyJson);
  survey.data = input.data;
  survey.clearIncorrectValues(true);
  if (Object.keys(preserved).length > 0) {
    survey.data = { ...survey.data, ...preserved };
  }
  return survey;
}

function preservedChoicesByUrl(
  definition: SurveyJson,
  data: SurveyResult,
): SurveyResult {
  const preserved: SurveyResult = {};
  for (const name of choicesByUrlNames(definition)) {
    if (Object.prototype.hasOwnProperty.call(data, name)) {
      preserved[name] = data[name];
    }
  }
  return preserved;
}

function choicesByUrlNames(definition: SurveyJson): string[] {
  const names: string[] = [];
  const visit = (nodes: unknown) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const element = node as Record<string, unknown>;
      if (typeof element.name === "string" && element.choicesByUrl != null) {
        names.push(element.name);
      }
      visit(element.elements);
      visit(element.templateElements);
    }
  };
  visit(definition.pages);
  visit(definition.elements);
  return names;
}

function validationFailed(questions: string[]) {
  return new APIError("BAD_REQUEST", {
    code: SURVEY_ERROR_CODES.VALIDATION_FAILED.code,
    message:
      questions.length > 0
        ? `Survey result is invalid: ${questions.join(", ")}`
        : SURVEY_ERROR_CODES.VALIDATION_FAILED.message,
    questions,
  });
}
