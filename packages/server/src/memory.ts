import {
  isAPIError,
  SURVEY_ERROR_CODES,
  type ArchiveSurveyInput,
  type PublishSurveyInput,
  type ResponseMutationInput,
  type ResponseRecord,
  type SavePartialInput,
  type SaveSurveyInput,
  type StartResponseInput,
  type SubmitResponseInput,
  type SurveyRecord,
  type SurveyStore,
} from "@dimah-survey/core";

import { errors } from "./errors";

function assertFresh(updatedAt: string, expectedUpdatedAt?: string) {
  if (expectedUpdatedAt !== undefined && expectedUpdatedAt !== updatedAt) {
    throw errors.staleUpdate();
  }
}

function now() {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function memoryAdapter(): SurveyStore {
  const surveys = new Map<string, SurveyRecord>();
  const slugToId = new Map<string, string>();
  const responses = new Map<string, ResponseRecord>();

  function requireSurvey(idOrSlug: string) {
    const byId = surveys.get(idOrSlug);
    if (byId) return byId;
    const id = slugToId.get(idOrSlug);
    const bySlug = id ? surveys.get(id) : undefined;
    if (!bySlug) {
      throw errors.surveyNotFound();
    }
    return bySlug;
  }

  function requireResponse(id: string) {
    const response = responses.get(id);
    if (!response) {
      throw errors.responseNotFound();
    }
    return response;
  }

  function bindSlug(id: string, slug: string, previous?: string) {
    if (previous && previous !== slug) slugToId.delete(previous);
    const owner = slugToId.get(slug);
    if (owner && owner !== id) {
      throw errors.slugTaken();
    }
    slugToId.set(slug, id);
  }

  return {
    async saveSurvey(input: SaveSurveyInput) {
      const existing =
        surveys.get(input.id) ?? surveys.get(slugToId.get(input.id) ?? "");
      const timestamp = now();
      if (existing) {
        assertFresh(existing.updatedAt, input.expectedUpdatedAt);
        const slug = input.slug ?? existing.slug;
        bindSlug(existing.id, slug, existing.slug);
        const next: SurveyRecord = {
          ...existing,
          slug,
          draftJson: clone(input.draftJson),
          updatedAt: timestamp,
        };
        surveys.set(existing.id, next);
        return clone(next);
      }
      if (input.expectedUpdatedAt) {
        throw errors.staleUpdate();
      }
      const slug = input.slug ?? input.id;
      bindSlug(input.id, slug);
      const created: SurveyRecord = {
        id: input.id,
        slug,
        status: "draft",
        draftJson: clone(input.draftJson),
        publishedJson: null,
        publishedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      surveys.set(input.id, created);
      return clone(created);
    },

    async publishSurvey(input: PublishSurveyInput) {
      const existing = requireSurvey(input.id);
      assertFresh(existing.updatedAt, input.expectedUpdatedAt);
      const timestamp = now();
      const next: SurveyRecord = {
        ...existing,
        status: "active",
        publishedJson: clone(existing.draftJson),
        publishedAt: timestamp,
        updatedAt: timestamp,
      };
      surveys.set(existing.id, next);
      return clone(next);
    },

    async archiveSurvey(input: ArchiveSurveyInput) {
      const existing = requireSurvey(input.id);
      assertFresh(existing.updatedAt, input.expectedUpdatedAt);
      const next: SurveyRecord = {
        ...existing,
        status: "archived",
        updatedAt: now(),
      };
      surveys.set(existing.id, next);
      return clone(next);
    },

    async getSurvey(idOrSlug: string) {
      try {
        return clone(requireSurvey(idOrSlug));
      } catch (error) {
        if (
          isAPIError(error) &&
          error.code === SURVEY_ERROR_CODES.SURVEY_NOT_FOUND.code
        ) {
          return null;
        }
        throw error;
      }
    },

    async startResponse(input: StartResponseInput) {
      const survey = requireSurvey(input.surveyId);
      if (survey.status !== "active" || survey.publishedJson === null) {
        throw errors.notPublished();
      }
      const timestamp = now();
      const response: ResponseRecord = {
        id: crypto.randomUUID(),
        surveyId: survey.id,
        respondentId: input.respondentId ?? null,
        status: "draft",
        definition: clone(survey.publishedJson),
        data: {},
        createdAt: timestamp,
        updatedAt: timestamp,
        submittedAt: null,
      };
      responses.set(response.id, response);
      return clone(response);
    },

    async savePartial(input: SavePartialInput) {
      const existing = requireResponse(input.id);
      if (existing.status !== "draft") {
        throw errors.responseClosed();
      }
      assertFresh(existing.updatedAt, input.expectedUpdatedAt);
      const next: ResponseRecord = {
        ...existing,
        data: clone(input.data),
        updatedAt: now(),
      };
      responses.set(existing.id, next);
      return clone(next);
    },

    async submitResponse(input: SubmitResponseInput) {
      const existing = requireResponse(input.id);
      if (existing.status !== "draft") {
        throw errors.responseClosed();
      }
      assertFresh(existing.updatedAt, input.expectedUpdatedAt);
      const timestamp = now();
      const next: ResponseRecord = {
        ...existing,
        data: clone(input.data ?? existing.data),
        status: "submitted",
        submittedAt: timestamp,
        updatedAt: timestamp,
      };
      responses.set(existing.id, next);
      return clone(next);
    },

    async abandonResponse(input: ResponseMutationInput) {
      const existing = requireResponse(input.id);
      if (existing.status !== "draft") {
        throw errors.responseClosed();
      }
      assertFresh(existing.updatedAt, input.expectedUpdatedAt);
      const next: ResponseRecord = {
        ...existing,
        status: "abandoned",
        updatedAt: now(),
      };
      responses.set(existing.id, next);
      return clone(next);
    },

    async reopenResponse(input: ResponseMutationInput) {
      const existing = requireResponse(input.id);
      if (existing.status === "draft") {
        throw errors.responseClosed();
      }
      assertFresh(existing.updatedAt, input.expectedUpdatedAt);
      const next: ResponseRecord = {
        ...existing,
        status: "draft",
        submittedAt: null,
        updatedAt: now(),
      };
      responses.set(existing.id, next);
      return clone(next);
    },

    async getResponse(id: string) {
      const response = responses.get(id);
      return response ? clone(response) : null;
    },
  };
}
