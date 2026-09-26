import {
  SURVEY_API_OPERATIONS,
  idQuerySchema,
  isAPIError,
  listResponsesQuerySchema,
  listSurveysQuerySchema,
  normalizeListPage,
  pageFromOverfetch,
  publishSurveyBodySchema,
  responseMutationBodySchema,
  savePartialBodySchema,
  saveSurveyBodySchema,
  startResponseBodySchema,
  submitResponseBodySchema,
  toResponseSummary,
} from "@dimah-survey/core";

import { createSurveyEndpoint } from "./create-survey-endpoint";
import { errors } from "@/errors";

const save = SURVEY_API_OPERATIONS.saveSurvey;
const getSurveyOp = SURVEY_API_OPERATIONS.getSurvey;
const listSurveysOp = SURVEY_API_OPERATIONS.listSurveys;
const publish = SURVEY_API_OPERATIONS.publishSurvey;
const archive = SURVEY_API_OPERATIONS.archiveSurvey;
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
    (ctx) => ctx.context.config.database.publishSurvey(ctx.body),
  ),
  archiveSurvey: createSurveyEndpoint(
    archive.path,
    { method: archive.method, body: publishSurveyBodySchema },
    (ctx) => ctx.context.config.database.archiveSurvey(ctx.body),
  ),
  startResponse: createSurveyEndpoint(
    start.path,
    { method: start.method, body: startResponseBodySchema },
    async (ctx) => {
      const database = ctx.context.config.database;
      if (ctx.body.resume) {
        if (!ctx.body.respondentId) throw errors.resumeRequiresRespondent();
        const survey = await database.getSurvey(ctx.body.surveyId);
        if (!survey) throw errors.surveyNotFound();
        const open = await database.findLatestDraft({
          surveyId: survey.id,
          respondentId: ctx.body.respondentId,
        });
        if (open) return open;
      }
      return database.startResponse({
        surveyId: ctx.body.surveyId,
        respondentId: ctx.body.respondentId,
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
    (ctx) => ctx.context.config.database.savePartial(ctx.body),
  ),
  submitResponse: createSurveyEndpoint(
    submit.path,
    { method: submit.method, body: submitResponseBodySchema },
    async (ctx) => {
      const database = ctx.context.config.database;
      const current = await database.getResponse(ctx.body.id);
      if (!current) throw errors.responseNotFound();
      if (current.status !== "draft") throw errors.responseClosed();
      const data = ctx.body.data ?? current.data;
      let stored = data;
      try {
        const checked = await ctx.context.config.validateResult({
          definition: current.definition,
          data,
        });
        if (checked) stored = checked;
      } catch (error) {
        if (isAPIError(error)) throw error;
        const message =
          error instanceof Error ? error.message : "Survey result is invalid.";
        throw errors.validationFailed(message);
      }
      const hooks = ctx.context.config.hooks;
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
