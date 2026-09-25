import { z } from "zod";

export const surveyJsonSchema = z.record(z.string(), z.unknown());
export const surveyResultSchema = z.record(z.string(), z.unknown());

const idSchema = z.string().min(1);
const expectedUpdatedAtSchema = z.string().min(1).optional();

export const idQuerySchema = z.object({
  id: idSchema,
});

export const saveSurveyBodySchema = z.object({
  id: idSchema,
  slug: z.string().min(1).optional(),
  draftJson: surveyJsonSchema,
  expectedUpdatedAt: expectedUpdatedAtSchema,
});

export const publishSurveyBodySchema = z.object({
  id: idSchema,
  expectedUpdatedAt: expectedUpdatedAtSchema,
});

export const startResponseBodySchema = z.object({
  surveyId: idSchema,
  respondentId: z.string().min(1).optional(),
});

export const savePartialBodySchema = z.object({
  id: idSchema,
  data: surveyResultSchema,
  expectedUpdatedAt: expectedUpdatedAtSchema,
});

export const submitResponseBodySchema = z.object({
  id: idSchema,
  data: surveyResultSchema.optional(),
  expectedUpdatedAt: expectedUpdatedAtSchema,
});

export const responseMutationBodySchema = z.object({
  id: idSchema,
  expectedUpdatedAt: expectedUpdatedAtSchema,
});
