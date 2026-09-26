import { z } from "zod";

export const LIST_DEFAULT_LIMIT = 50;
export const LIST_MAX_LIMIT = 100;

export const surveyJsonSchema = z.record(z.string(), z.unknown());
export const surveyResultSchema = z.record(z.string(), z.unknown());

const idSchema = z.string().min(1);
const expectedUpdatedAtSchema = z.string().min(1).optional();

const listPageQueryFields = {
  limit: z.coerce.number().pipe(z.int().min(1).max(LIST_MAX_LIMIT)).optional(),
  offset: z.coerce.number().pipe(z.int().nonnegative()).optional(),
};

const isoDateTimeQuerySchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    error: "Invalid datetime",
  });

export const surveyStatusSchema = z.enum(["draft", "active", "archived"]);
export const responseStatusSchema = z.enum(["draft", "submitted", "abandoned"]);

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

export const listSurveysQuerySchema = z
  .object({
    status: surveyStatusSchema.optional(),
    ...listPageQueryFields,
  })
  .optional();

export const listResponsesQuerySchema = z
  .object({
    surveyId: idSchema.optional(),
    respondentId: z.string().min(1).optional(),
    status: responseStatusSchema.optional(),
    submittedFrom: isoDateTimeQuerySchema.optional(),
    submittedTo: isoDateTimeQuerySchema.optional(),
    updatedAfter: isoDateTimeQuerySchema.optional(),
    include: z.enum(["summary", "full"]).optional(),
    ...listPageQueryFields,
  })
  .optional();

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
