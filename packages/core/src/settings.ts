import { APIError } from "./error";
import { SURVEY_ERROR_CODES } from "./error-codes";
import { surveySettingsSchema } from "./schemas";
import type {
  PublishedSurvey,
  ResponseRecord,
  SurveyRecord,
  SurveySettings,
} from "./types";

export const DEFAULT_SURVEY_SETTINGS: SurveySettings = {
  responses: "one-open",
  reopen: true,
  opensAt: null,
  closesAt: null,
  maxResponses: null,
};

/** Fill missing keys from {@link DEFAULT_SURVEY_SETTINGS}. Invalid values fall back too. */
export function readSurveySettings(value: unknown): SurveySettings {
  const source =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const candidate = {
    responses:
      source.responses === "single"
        ? "single"
        : DEFAULT_SURVEY_SETTINGS.responses,
    reopen:
      typeof source.reopen === "boolean"
        ? source.reopen
        : DEFAULT_SURVEY_SETTINGS.reopen,
    opensAt: typeof source.opensAt === "string" ? source.opensAt : null,
    closesAt: typeof source.closesAt === "string" ? source.closesAt : null,
    maxResponses:
      typeof source.maxResponses === "number" &&
      Number.isInteger(source.maxResponses) &&
      source.maxResponses > 0
        ? source.maxResponses
        : null,
  } satisfies SurveySettings;
  const parsed = surveySettingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : { ...DEFAULT_SURVEY_SETTINGS };
}

/** `opensAt` and `closesAt` are inclusive. Outside the window throws `SURVEY_CLOSED`. */
export function assertSurveyAccepting(
  settings: SurveySettings,
  now = Date.now(),
) {
  if (settings.opensAt !== null) {
    const opens = Date.parse(settings.opensAt);
    if (!Number.isNaN(opens) && now < opens) {
      throw APIError.from("CONFLICT", SURVEY_ERROR_CODES.SURVEY_CLOSED);
    }
  }
  if (settings.closesAt !== null) {
    const closes = Date.parse(settings.closesAt);
    if (!Number.isNaN(closes) && now > closes) {
      throw APIError.from("CONFLICT", SURVEY_ERROR_CODES.SURVEY_CLOSED);
    }
  }
}

/** `submittedCount` includes only rows already stored as `submitted`. */
export function assertResponseLimit(
  settings: SurveySettings,
  submittedCount: number,
) {
  if (
    settings.maxResponses !== null &&
    submittedCount >= settings.maxResponses
  ) {
    throw APIError.from("CONFLICT", SURVEY_ERROR_CODES.RESPONSE_LIMIT);
  }
}

export function assertReopenAllowed(settings: SurveySettings) {
  if (!settings.reopen) {
    throw APIError.from("CONFLICT", SURVEY_ERROR_CODES.RESPONSE_CLOSED);
  }
}

/**
 * Row an identified start should return instead of inserting.
 * Anonymous callers pass no `respondentId` and always insert.
 */
export function existingResponseForStart(input: {
  settings: SurveySettings;
  respondentId?: string;
  openDraft: ResponseRecord | null;
  latest: ResponseRecord | null;
}): ResponseRecord | null {
  if (!input.respondentId) return null;
  if (input.settings.responses === "single") return input.latest;
  return input.openDraft;
}

export function toPublishedSurvey(
  survey: SurveyRecord,
): PublishedSurvey | null {
  if (
    survey.status !== "active" ||
    survey.publishedJson === null ||
    survey.publishedAt === null
  ) {
    return null;
  }
  return {
    id: survey.id,
    slug: survey.slug,
    publishedJson: survey.publishedJson,
    publishedAt: survey.publishedAt,
    settings: survey.settings,
  };
}
