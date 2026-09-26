import { z } from "zod";

export const surveyFetchErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  questions: z.array(z.string()).optional(),
});
