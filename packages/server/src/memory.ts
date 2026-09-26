import {
  DEFAULT_SURVEY_SETTINGS,
  assertReopenAllowed,
  assertResponseLimit,
  assertSurveyAccepting,
  existingResponseForStart,
  isAPIError,
  SURVEY_ERROR_CODES,
  toResponseSummary,
  type ArchiveSurveyInput,
  type ListResponsesQuery,
  type ListSurveysQuery,
  type PublishSurveyInput,
  type ResponseMutationInput,
  type ResponseRecord,
  type ResumeSurveyInput,
  type SavePartialInput,
  type SaveSurveyInput,
  type SaveSurveySettingsInput,
  type StartResponseInput,
  type StartResponseLifecycle,
  type SubmitResponseInput,
  type SurveyRecord,
  type SurveyStore,
} from "@dimah-survey/core";

import { errors } from "./errors";
import { createKeyLock } from "./key-lock";

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

function draftKey(surveyId: string, respondentId: string) {
  return `${surveyId}\0${respondentId}`;
}

function surveyKey(surveyId: string) {
  return `survey\0${surveyId}`;
}

export function memoryAdapter(): SurveyStore {
  const surveys = new Map<string, SurveyRecord>();
  const slugToId = new Map<string, string>();
  const responses = new Map<string, ResponseRecord>();
  const exclusive = createKeyLock();

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

  function latestDraft(surveyId: string, respondentId: string) {
    return latestFor(surveyId, respondentId, "draft");
  }

  function latestFor(
    surveyId: string,
    respondentId: string,
    status?: ResponseRecord["status"],
  ) {
    return sortByUpdatedAtDesc(
      [...responses.values()].filter(
        (row) =>
          row.surveyId === surveyId &&
          row.respondentId === respondentId &&
          (status === undefined || row.status === status),
      ),
    )[0];
  }

  function submittedCount(surveyId: string) {
    let count = 0;
    for (const row of responses.values()) {
      if (row.surveyId === surveyId && row.status === "submitted") count += 1;
    }
    return count;
  }

  function requireAccepting(survey: SurveyRecord) {
    if (survey.status !== "active" || survey.publishedJson === null) {
      throw errors.notPublished();
    }
    assertSurveyAccepting(survey.settings);
  }

  function openResponse(survey: SurveyRecord, respondentId?: string) {
    if (survey.status !== "active" || survey.publishedJson === null) {
      throw errors.notPublished();
    }
    const timestamp = now();
    const response: ResponseRecord = {
      id: crypto.randomUUID(),
      surveyId: survey.id,
      respondentId: respondentId ?? null,
      status: "draft",
      definition: clone(survey.publishedJson),
      data: {},
      createdAt: timestamp,
      updatedAt: timestamp,
      submittedAt: null,
    };
    responses.set(response.id, response);
    return clone(response);
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
        settings: { ...DEFAULT_SURVEY_SETTINGS },
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

    async saveSurveySettings(input: SaveSurveySettingsInput) {
      const existing = requireSurvey(input.id);
      assertFresh(existing.updatedAt, input.expectedUpdatedAt);
      const next: SurveyRecord = {
        ...existing,
        settings: clone(input.settings),
        updatedAt: now(),
      };
      surveys.set(existing.id, next);
      return clone(next);
    },

    async resumeSurvey(input: ResumeSurveyInput) {
      const existing = requireSurvey(input.id);
      if (existing.status === "active") return clone(existing);
      if (existing.status === "archived" && existing.publishedJson !== null) {
        assertFresh(existing.updatedAt, input.expectedUpdatedAt);
        const next: SurveyRecord = {
          ...existing,
          status: "active",
          updatedAt: now(),
        };
        surveys.set(existing.id, next);
        return clone(next);
      }
      throw errors.notPublished();
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
      const open = latestDraft(query.surveyId, query.respondentId);
      return open ? clone(open) : null;
    },

    async startResponse(
      input: StartResponseInput,
      lifecycle?: StartResponseLifecycle,
    ) {
      const survey = requireSurvey(input.surveyId);
      return exclusive(surveyKey(survey.id), async () => {
        const fresh = requireSurvey(survey.id);
        requireAccepting(fresh);
        if (!input.respondentId) {
          assertResponseLimit(fresh.settings, submittedCount(fresh.id));
          await lifecycle?.onStart?.(fresh);
          const created = openResponse(fresh);
          await lifecycle?.afterStart?.(created);
          return created;
        }
        const respondentId = input.respondentId;
        return exclusive(draftKey(fresh.id, respondentId), async () => {
          const current = requireSurvey(fresh.id);
          requireAccepting(current);
          const existing = existingResponseForStart({
            settings: current.settings,
            respondentId,
            openDraft: latestDraft(current.id, respondentId) ?? null,
            latest: latestFor(current.id, respondentId) ?? null,
          });
          if (existing) return clone(existing);
          assertResponseLimit(current.settings, submittedCount(current.id));
          await lifecycle?.onStart?.(current);
          const created = openResponse(current, respondentId);
          await lifecycle?.afterStart?.(created);
          return created;
        });
      });
    },

    async savePartial(input: SavePartialInput) {
      const existing = requireResponse(input.id);
      if (existing.status !== "draft") {
        throw errors.responseClosed();
      }
      assertSurveyAccepting(requireSurvey(existing.surveyId).settings);
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
      return exclusive(surveyKey(existing.surveyId), async () => {
        const current = requireResponse(input.id);
        if (current.status !== "draft") {
          throw errors.responseClosed();
        }
        const survey = requireSurvey(current.surveyId);
        assertSurveyAccepting(survey.settings);
        assertResponseLimit(survey.settings, submittedCount(survey.id));
        assertFresh(current.updatedAt, input.expectedUpdatedAt);
        const timestamp = now();
        const next: ResponseRecord = {
          ...current,
          data: clone(input.data ?? current.data),
          status: "submitted",
          submittedAt: timestamp,
          updatedAt: timestamp,
        };
        responses.set(current.id, next);
        return clone(next);
      });
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
      assertReopenAllowed(requireSurvey(existing.surveyId).settings);
      const run = async () => {
        const current = requireResponse(input.id);
        if (current.status === "draft") throw errors.responseClosed();
        if (current.respondentId) {
          const open = latestDraft(current.surveyId, current.respondentId);
          if (open && open.id !== current.id) throw errors.openDraft();
        }
        assertFresh(current.updatedAt, input.expectedUpdatedAt);
        const next: ResponseRecord = {
          ...current,
          status: "draft",
          submittedAt: null,
          updatedAt: now(),
        };
        responses.set(current.id, next);
        return clone(next);
      };
      if (!existing.respondentId) return run();
      return exclusive(draftKey(existing.surveyId, existing.respondentId), run);
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
