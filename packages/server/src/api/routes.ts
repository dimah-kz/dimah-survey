import {
  SURVEY_API_OPERATIONS,
  SURVEY_ERROR_CODES,
  assertResponseLimit,
  assertSurveyAccepting,
  idQuerySchema,
  isAPIError,
  listResponsesQuerySchema,
  listSurveysQuerySchema,
  normalizeListPage,
  pageFromOverfetch,
  publishSurveyBodySchema,
  responseMutationBodySchema,
  sameJson,
  savePartialBodySchema,
  saveSurveyBodySchema,
  saveSurveySettingsBodySchema,
  startResponseBodySchema,
  submitResponseBodySchema,
  toPublishedSurvey,
  toResponseSummary,
  type ResponseRecord,
  type SurveyJson,
  type SurveyResult,
  type ValidateResult,
} from "@dimah-survey/core";

import { createSurveyEndpoint } from "./create-survey-endpoint";
import type {
  EditorHooks,
  FillHooks,
  ResolvedDimahSurveyConfig,
} from "@/dimah-survey";
import { errors } from "@/errors";
import { clearSurveyResult } from "@/validate";

const save = SURVEY_API_OPERATIONS.saveSurvey;
const getSurveyOp = SURVEY_API_OPERATIONS.getSurvey;
const listSurveysOp = SURVEY_API_OPERATIONS.listSurveys;
const publish = SURVEY_API_OPERATIONS.publishSurvey;
const archive = SURVEY_API_OPERATIONS.archiveSurvey;
const saveSettings = SURVEY_API_OPERATIONS.saveSurveySettings;
const resume = SURVEY_API_OPERATIONS.resumeSurvey;
const published = SURVEY_API_OPERATIONS.getPublishedSurvey;
const start = SURVEY_API_OPERATIONS.startResponse;
const partial = SURVEY_API_OPERATIONS.savePartial;
const submit = SURVEY_API_OPERATIONS.submitResponse;
const abandon = SURVEY_API_OPERATIONS.abandonResponse;
const reopen = SURVEY_API_OPERATIONS.reopenResponse;
const listResponsesOp = SURVEY_API_OPERATIONS.listResponses;
const getResponseOp = SURVEY_API_OPERATIONS.getResponse;

export const surveyEndpoints = {
  saveSurvey: createSurveyEndpoint(
    save.path,
    { method: save.method, body: saveSurveyBodySchema },
    (ctx) => ctx.context.config.database.saveSurvey(ctx.body),
  ),
  getSurvey: createSurveyEndpoint(
    getSurveyOp.path,
    { method: getSurveyOp.method, query: idQuerySchema },
    async (ctx) => {
      const survey = await ctx.context.config.database.getSurvey(ctx.query.id);
      if (!survey) throw errors.surveyNotFound();
      return survey;
    },
  ),
  listSurveys: createSurveyEndpoint(
    listSurveysOp.path,
    { method: listSurveysOp.method, query: listSurveysQuerySchema },
    async (ctx) => {
      const query = ctx.query ?? {};
      const { limit, offset } = normalizeListPage(query);
      const rows = await ctx.context.config.database.listSurveys({
        status: query.status,
        limit: limit + 1,
        offset,
      });
      const page = pageFromOverfetch(rows, limit, offset);
      return {
        surveys: page.items,
        limit,
        offset,
        nextOffset: page.nextOffset,
      };
    },
  ),
  publishSurvey: createSurveyEndpoint(
    publish.path,
    { method: publish.method, body: publishSurveyBodySchema },
    async (ctx) => {
      const database = ctx.context.config.database;
      const current = await database.getSurvey(ctx.body.id);
      if (!current) throw errors.surveyNotFound();
      const request = ctx.context.request;
      const hooks = editorHooks(ctx.context.config);
      await hooks?.onPublish?.({ request, survey: current });
      const saved = await database.publishSurvey(ctx.body);
      await hooks?.afterPublish?.({ request, survey: saved });
      return saved;
    },
  ),
  archiveSurvey: createSurveyEndpoint(
    archive.path,
    { method: archive.method, body: publishSurveyBodySchema },
    (ctx) => ctx.context.config.database.archiveSurvey(ctx.body),
  ),
  saveSurveySettings: createSurveyEndpoint(
    saveSettings.path,
    { method: saveSettings.method, body: saveSurveySettingsBodySchema },
    (ctx) => ctx.context.config.database.saveSurveySettings(ctx.body),
  ),
  resumeSurvey: createSurveyEndpoint(
    resume.path,
    { method: resume.method, body: publishSurveyBodySchema },
    (ctx) => ctx.context.config.database.resumeSurvey(ctx.body),
  ),
  getPublishedSurvey: createSurveyEndpoint(
    published.path,
    { method: published.method, query: idQuerySchema },
    async (ctx) => {
      const survey = await ctx.context.config.database.getSurvey(ctx.query.id);
      const publishedSurvey = survey ? toPublishedSurvey(survey) : null;
      if (!publishedSurvey) throw errors.surveyNotFound();
      return publishedSurvey;
    },
  ),
  startResponse: createSurveyEndpoint(
    start.path,
    { method: start.method, body: startResponseBodySchema },
    (ctx) => {
      const request = ctx.context.request;
      const hooks = fillHooks(ctx.context.config);
      return ctx.context.config.database.startResponse(ctx.body, {
        onStart: (survey) => hooks?.onStart?.({ request, survey }),
        afterStart: (response) => hooks?.afterStart?.({ request, response }),
      });
    },
  ),
  listResponses: createSurveyEndpoint(
    listResponsesOp.path,
    { method: listResponsesOp.method, query: listResponsesQuerySchema },
    async (ctx) => {
      const query = ctx.query ?? {};
      const { limit, offset } = normalizeListPage(query);
      const include = query.include === "full" ? "full" : "summary";
      let surveyId = query.surveyId;
      if (surveyId) {
        const survey = await ctx.context.config.database.getSurvey(surveyId);
        if (!survey) {
          return {
            responses: [],
            limit,
            offset,
            nextOffset: null,
            total: 0,
          };
        }
        surveyId = survey.id;
      }
      const filter = {
        surveyId,
        respondentId: query.respondentId,
        status: query.status,
        submittedFrom: query.submittedFrom,
        submittedTo: query.submittedTo,
        updatedAfter: query.updatedAfter,
      };
      const database = ctx.context.config.database;
      const rows = await database.listResponses({
        ...filter,
        include,
        limit: limit + 1,
        offset,
      });
      const page = pageFromOverfetch(rows, limit, offset);
      const total = await database.countResponses(filter);
      return {
        responses:
          include === "full" ? page.items : page.items.map(toResponseSummary),
        limit,
        offset,
        nextOffset: page.nextOffset,
        total,
      };
    },
  ),
  savePartial: createSurveyEndpoint(
    partial.path,
    { method: partial.method, body: savePartialBodySchema },
    async (ctx) => {
      const database = ctx.context.config.database;
      const current = await database.getResponse(ctx.body.id);
      if (!current) throw errors.responseNotFound();
      const data =
        ctx.context.config.sanitizePartial === "replace"
          ? ctx.body.data
          : clearSurveyResult({
              definition: current.definition,
              data: ctx.body.data,
            });
      return database.savePartial({ ...ctx.body, data });
    },
  ),
  submitResponse: createSurveyEndpoint(
    submit.path,
    { method: submit.method, body: submitResponseBodySchema },
    async (ctx) => {
      const database = ctx.context.config.database;
      const current = await database.getResponse(ctx.body.id);
      if (!current) throw errors.responseNotFound();
      const validateResult = ctx.context.config.validateResult;
      if (current.status === "submitted") {
        return replaySubmit(current, ctx.body.data, validateResult);
      }
      if (current.status !== "draft") throw errors.responseClosed();
      const survey = await database.getSurvey(current.surveyId);
      if (!survey) throw errors.surveyNotFound();
      assertSurveyAccepting(survey.settings);
      if (survey.settings.maxResponses !== null) {
        const submitted = await database.countResponses({
          surveyId: survey.id,
          status: "submitted",
        });
        assertResponseLimit(survey.settings, submitted);
      }
      const stored = await cleanedResult(
        validateResult,
        current.definition,
        ctx.body.data ?? current.data,
      );
      const hooks = fillHooks(ctx.context.config);
      const request = ctx.context.request;
      await hooks?.onSubmit?.({
        request,
        response: { ...current, data: stored },
      });
      const saved = await database.submitResponse({
        ...ctx.body,
        data: stored,
      });
      await hooks?.afterSubmit?.({ request, response: saved });
      return saved;
    },
  ),
  abandonResponse: createSurveyEndpoint(
    abandon.path,
    { method: abandon.method, body: responseMutationBodySchema },
    (ctx) => ctx.context.config.database.abandonResponse(ctx.body),
  ),
  reopenResponse: createSurveyEndpoint(
    reopen.path,
    { method: reopen.method, body: responseMutationBodySchema },
    (ctx) => ctx.context.config.database.reopenResponse(ctx.body),
  ),
  getResponse: createSurveyEndpoint(
    getResponseOp.path,
    { method: getResponseOp.method, query: idQuerySchema },
    async (ctx) => {
      const response = await ctx.context.config.database.getResponse(
        ctx.query.id,
      );
      if (!response) throw errors.responseNotFound();
      return response;
    },
  ),
};

export const fillSurveyEndpoints = {
  getPublishedSurvey: surveyEndpoints.getPublishedSurvey,
  startResponse: surveyEndpoints.startResponse,
  getResponse: surveyEndpoints.getResponse,
  listResponses: surveyEndpoints.listResponses,
  savePartial: surveyEndpoints.savePartial,
  submitResponse: surveyEndpoints.submitResponse,
  abandonResponse: surveyEndpoints.abandonResponse,
  reopenResponse: surveyEndpoints.reopenResponse,
};

export const editorSurveyEndpoints = {
  getSurvey: surveyEndpoints.getSurvey,
  saveSurvey: surveyEndpoints.saveSurvey,
  listSurveys: surveyEndpoints.listSurveys,
  publishSurvey: surveyEndpoints.publishSurvey,
  archiveSurvey: surveyEndpoints.archiveSurvey,
  saveSurveySettings: surveyEndpoints.saveSurveySettings,
  resumeSurvey: surveyEndpoints.resumeSurvey,
  getResponse: surveyEndpoints.getResponse,
  listResponses: surveyEndpoints.listResponses,
};

function fillHooks(config: ResolvedDimahSurveyConfig): FillHooks | undefined {
  if (config.audience !== "fill") return;
  return config.hooks as FillHooks | undefined;
}

function editorHooks(
  config: ResolvedDimahSurveyConfig,
): EditorHooks | undefined {
  if (config.audience !== "editor") return;
  return config.hooks as EditorHooks | undefined;
}

const validationCodes: ReadonlySet<string> = new Set([
  SURVEY_ERROR_CODES.VALIDATION_FAILED.code,
  SURVEY_ERROR_CODES.VALIDATION_ERROR.code,
]);

async function cleanedResult(
  validateResult: ValidateResult,
  definition: SurveyJson,
  data: SurveyResult,
) {
  try {
    const checked = await validateResult({ definition, data });
    return checked ?? data;
  } catch (error) {
    if (isAPIError(error)) throw error;
    const message =
      error instanceof Error ? error.message : "Survey result is invalid.";
    throw errors.validationFailed(message);
  }
}

/**
 * A retry of a submit that already landed returns the stored row.
 * Hooks do not run again. A different cleaned payload conflicts.
 */
async function replaySubmit(
  current: ResponseRecord,
  data: SurveyResult | undefined,
  validateResult: ValidateResult,
) {
  if (data === undefined) return current;
  try {
    const stored = await cleanedResult(
      validateResult,
      current.definition,
      data,
    );
    if (sameJson(stored, current.data)) return current;
  } catch (error) {
    if (isAPIError(error) && error.code && validationCodes.has(error.code)) {
      throw errors.responseClosed();
    }
    throw error;
  }
  throw errors.responseClosed();
}
