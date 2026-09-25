import {
  SURVEY_API_OPERATIONS,
  idQuerySchema,
  isAPIError,
  publishSurveyBodySchema,
  responseMutationBodySchema,
  savePartialBodySchema,
  saveSurveyBodySchema,
  startResponseBodySchema,
  submitResponseBodySchema,
} from "@dimah-survey/core";

import { createSurveyEndpoint } from "./create-survey-endpoint";
import { errors } from "@/errors";

const save = SURVEY_API_OPERATIONS.saveSurvey;
const getSurveyOp = SURVEY_API_OPERATIONS.getSurvey;
const publish = SURVEY_API_OPERATIONS.publishSurvey;
const archive = SURVEY_API_OPERATIONS.archiveSurvey;
const start = SURVEY_API_OPERATIONS.startResponse;
const partial = SURVEY_API_OPERATIONS.savePartial;
const submit = SURVEY_API_OPERATIONS.submitResponse;
const abandon = SURVEY_API_OPERATIONS.abandonResponse;
const reopen = SURVEY_API_OPERATIONS.reopenResponse;
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
    (ctx) => ctx.context.config.database.startResponse(ctx.body),
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
      return database.submitResponse({ ...ctx.body, data: stored });
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
