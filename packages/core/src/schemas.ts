import { z } from "zod";
import { SurveyError, errorCodes } from "./errors";

export const surveyJsonSchema = z.record(z.string(), z.unknown());
export const surveyResultSchema = z.record(z.string(), z.unknown());

export const saveSurveyBodySchema = z.object({
  slug: z.string().min(1).optional(),
  draftJson: surveyJsonSchema,
  expectedUpdatedAt: z.string().min(1).optional(),
});

export const concurrencyBodySchema = z.object({
  expectedUpdatedAt: z.string().min(1).optional(),
});

export const startResponseBodySchema = z.object({
  respondentId: z.string().min(1).optional(),
});

export const savePartialBodySchema = z.object({
  data: surveyResultSchema,
  expectedUpdatedAt: z.string().min(1).optional(),
});

export const submitResponseBodySchema = z.object({
  data: surveyResultSchema.optional(),
  expectedUpdatedAt: z.string().min(1).optional(),
});

export function parseBody<Schema extends z.ZodType>(
  schema: Schema,
  body: unknown,
): z.output<Schema> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new SurveyError(
      errorCodes.INVALID_BODY,
      "Request body does not match the protocol.",
      400,
    );
  }
  return result.data;
}
