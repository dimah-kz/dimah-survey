import {
  isAPIError,
  SURVEY_ERROR_CODES,
  toResponseSummary,
  type ArchiveSurveyInput,
  type ListResponsesQuery,
  type ListSurveysQuery,
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

function sortByUpdatedAtDesc<T extends { updatedAt: string }>(items: T[]) {
  return items.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function slicePage<T>(
  items: readonly T[],
  query?: { limit?: number; offset?: number },
) {
  const offset = query?.offset ?? 0;
  if (query?.limit === undefined) return items.slice(offset);
  return items.slice(offset, offset + query.limit);
}

function responseMatches(row: ResponseRecord, query?: ListResponsesQuery) {
  if (!query) return true;
  if (query.surveyId && row.surveyId !== query.surveyId) return false;
  if (query.respondentId && row.respondentId !== query.respondentId) {
    return false;
  }
  if (query.status && row.status !== query.status) return false;
  if (query.submittedFrom || query.submittedTo) {
    if (!row.submittedAt) return false;
    const submitted = Date.parse(row.submittedAt);
    if (query.submittedFrom && submitted < Date.parse(query.submittedFrom)) {
      return false;
    }
    if (query.submittedTo && submitted > Date.parse(query.submittedTo)) {
      return false;
    }
  }
  if (
    query.updatedAfter &&
    !(Date.parse(row.updatedAt) > Date.parse(query.updatedAfter))
  ) {
    return false;
  }
  return true;
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
    const owner = slugToId.get(slug);
    if (owner && owner !== id) throw errors.slugTaken();
    const idClash = surveys.get(slug);
    if (idClash && idClash.id !== id) throw errors.slugTaken();
    if (previous && previous !== slug) slugToId.delete(previous);
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

    async listSurveys(query?: ListSurveysQuery) {
      const filtered = sortByUpdatedAtDesc(
        [...surveys.values()].filter(
          (survey) => !query?.status || survey.status === query.status,
        ),
      );
      return slicePage(filtered, query).map(clone);
    },

    async findLatestDraft(query: { surveyId: string; respondentId: string }) {
      const open = sortByUpdatedAtDesc(
        [...responses.values()].filter(
          (row) =>
            row.surveyId === query.surveyId &&
            row.respondentId === query.respondentId &&
            row.status === "draft",
        ),
      );
      return open[0] ? clone(open[0]) : null;
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

    async listResponses(query?: ListResponsesQuery) {
      const page = slicePage(
        sortByUpdatedAtDesc(
          [...responses.values()].filter((row) => responseMatches(row, query)),
        ),
        query,
      ).map(clone);
      if (query?.include === "full") return page;
      return page.map(toResponseSummary);
    },

    async countResponses(query?: ListResponsesQuery) {
      return [...responses.values()].filter((row) =>
        responseMatches(row, query),
      ).length;
    },
  };
}
