import {
  DEFAULT_SURVEY_SETTINGS,
  SURVEY_ERROR_CODES,
  APIError,
  assertReopenAllowed,
  assertResponseLimit,
  assertSurveyAccepting,
  existingResponseForStart,
  readSurveySettings,
  type ListResponsesQuery,
  type ListSurveysQuery,
  type ResponseRecord,
  type ResponseSummary,
  type ResumeSurveyInput,
  type SaveSurveySettingsInput,
  type StartResponseLifecycle,
  type SurveyRecord,
  type SurveySettings,
  type SurveyStore,
} from "@dimah-survey/core";
import type { InferFumaDB } from "fumadb";

import { responseWriteLanded, surveyWriteLanded } from "./cas";
import { v1, type DimahSurveyDB } from "./fuma-db";
import { createKeyLock } from "./key-lock";
import { isUniqueViolation } from "./unique";

export type DimahSurveyDbClient = InferFumaDB<typeof DimahSurveyDB>;

type SurveyRow = {
  id: string;
  slug: string;
  status: string;
  draftJson: SurveyRecord["draftJson"];
  publishedJson: SurveyRecord["publishedJson"];
  publishedAt: Date | string | null;
  settings?: SurveySettings | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type ResponseRow = {
  id: string;
  surveyId: string;
  respondentId?: string | null;
  status: string;
  definition: ResponseRecord["definition"];
  data: ResponseRecord["data"];
  submittedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function isoOrNull(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  return iso(value);
}

function toSurvey(row: SurveyRow): SurveyRecord {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status as SurveyRecord["status"],
    draftJson: structuredClone(row.draftJson),
    publishedJson: row.publishedJson
      ? structuredClone(row.publishedJson)
      : null,
    publishedAt: isoOrNull(row.publishedAt),
    settings: readSurveySettings(row.settings),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function toSummary(row: ResponseRow): ResponseSummary {
  return {
    id: row.id,
    surveyId: row.surveyId,
    respondentId: row.respondentId ?? null,
    status: row.status as ResponseSummary["status"],
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    submittedAt: isoOrNull(row.submittedAt),
  };
}

function toResponse(row: ResponseRow): ResponseRecord {
  return {
    id: row.id,
    surveyId: row.surveyId,
    respondentId: row.respondentId ?? null,
    status: row.status as ResponseRecord["status"],
    definition: structuredClone(row.definition),
    data: structuredClone(row.data),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    submittedAt: isoOrNull(row.submittedAt),
  };
}

const RESPONSE_SUMMARY_COLUMNS = [
  "id",
  "surveyId",
  "respondentId",
  "status",
  "submittedAt",
  "createdAt",
  "updatedAt",
] as const;

function listResponseWhere<T>(
  query: ListResponsesQuery,
  b: {
    (
      col: "surveyId" | "respondentId" | "status" | "submittedAt" | "updatedAt",
      op: "=" | ">=" | "<=" | ">",
      value: string | Date,
    ): T;
    and: (...parts: T[]) => T;
  },
): T {
  const parts: T[] = [];
  if (query.surveyId) parts.push(b("surveyId", "=", query.surveyId));
  if (query.respondentId) {
    parts.push(b("respondentId", "=", query.respondentId));
  }
  if (query.status) parts.push(b("status", "=", query.status));
  if (query.submittedFrom) {
    parts.push(b("submittedAt", ">=", new Date(query.submittedFrom)));
  }
  if (query.submittedTo) {
    parts.push(b("submittedAt", "<=", new Date(query.submittedTo)));
  }
  if (query.updatedAfter) {
    parts.push(b("updatedAt", ">", new Date(query.updatedAfter)));
  }
  const first = parts[0];
  if (first !== undefined && parts.length === 1) return first;
  return b.and(...parts);
}

function hasListResponseFilters(query?: ListResponsesQuery) {
  return Boolean(
    query?.surveyId ||
    query?.respondentId ||
    query?.status ||
    query?.submittedFrom ||
    query?.submittedTo ||
    query?.updatedAfter,
  );
}

function stale() {
  return APIError.from("CONFLICT", SURVEY_ERROR_CODES.STALE_UPDATE);
}

function slugTaken() {
  return APIError.from("CONFLICT", SURVEY_ERROR_CODES.SLUG_TAKEN);
}

function openDraft() {
  return APIError.from("CONFLICT", SURVEY_ERROR_CODES.OPEN_DRAFT);
}

function notPublished() {
  return APIError.from("CONFLICT", SURVEY_ERROR_CODES.NOT_PUBLISHED);
}

function draftKey(surveyId: string, respondentId: string) {
  return `${surveyId}\0${respondentId}`;
}

function surveyKey(surveyId: string) {
  return `survey\0${surveyId}`;
}

export function db(client: DimahSurveyDbClient): SurveyStore {
  const orm = client.orm(v1.version);
  const exclusive = createKeyLock();

  async function readSurvey(idOrSlug: string) {
    const byId = await orm.findFirst("survey", {
      where: (b) => b("id", "=", idOrSlug),
    });
    if (byId) return toSurvey(byId as SurveyRow);
    const bySlug = await orm.findFirst("survey", {
      where: (b) => b("slug", "=", idOrSlug),
    });
    return bySlug ? toSurvey(bySlug as SurveyRow) : null;
  }

  async function writeSurvey(
    row: SurveyRecord,
    expectedUpdatedAt: string | undefined,
    creating: boolean,
  ) {
    const updatedAt = new Date(row.updatedAt);
    const columns = {
      slug: row.slug,
      status: row.status,
      draftJson: row.draftJson,
      publishedJson: row.publishedJson,
      publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
      settings: row.settings,
      updatedAt,
    };
    try {
      if (expectedUpdatedAt !== undefined) {
        await orm.updateMany("survey", {
          set: columns,
          where: (b) =>
            b.and(
              b("id", "=", row.id),
              b("updatedAt", "=", new Date(expectedUpdatedAt)),
            ),
        });
      } else if (creating) {
        await orm.create("survey", {
          id: row.id,
          ...columns,
          createdAt: new Date(row.createdAt),
        });
      } else {
        await orm.updateMany("survey", {
          set: columns,
          where: (b) => b("id", "=", row.id),
        });
      }
    } catch (error) {
      if (isUniqueViolation(error)) throw slugTaken();
      throw error;
    }
    const fresh = await readSurvey(row.id);
    if (expectedUpdatedAt !== undefined) {
      if (!fresh || !surveyWriteLanded(fresh, row)) throw stale();
      return fresh;
    }
    if (!fresh) {
      throw APIError.from(
        "INTERNAL_SERVER_ERROR",
        SURVEY_ERROR_CODES.INTERNAL_ERROR,
      );
    }
    return fresh;
  }

  async function latestDraft(query: {
    surveyId: string;
    respondentId: string;
  }) {
    const rows = await orm.findMany("response", {
      where: (b) =>
        b.and(
          b("surveyId", "=", query.surveyId),
          b("respondentId", "=", query.respondentId),
          b("status", "=", "draft"),
        ),
      orderBy: ["updatedAt", "desc"],
      limit: 1,
    });
    const row = rows[0];
    return row ? toResponse(row as ResponseRow) : null;
  }

  async function latestResponse(query: {
    surveyId: string;
    respondentId: string;
  }) {
    const rows = await orm.findMany("response", {
      where: (b) =>
        b.and(
          b("surveyId", "=", query.surveyId),
          b("respondentId", "=", query.respondentId),
        ),
      orderBy: ["updatedAt", "desc"],
      limit: 1,
    });
    const row = rows[0];
    return row ? toResponse(row as ResponseRow) : null;
  }

  async function countSubmitted(surveyId: string) {
    return orm.count("response", {
      where: (b) =>
        b.and(b("surveyId", "=", surveyId), b("status", "=", "submitted")),
    });
  }

  async function readResponse(id: string) {
    const row = await orm.findFirst("response", {
      where: (b) => b("id", "=", id),
    });
    return row ? toResponse(row as ResponseRow) : null;
  }

  async function insertResponse(
    survey: SurveyRecord,
    respondentId?: string,
  ): Promise<{ row: ResponseRecord; inserted: boolean }> {
    if (survey.status !== "active" || !survey.publishedJson)
      throw notPublished();
    const now = new Date().toISOString();
    const row: ResponseRecord = {
      id: crypto.randomUUID(),
      surveyId: survey.id,
      respondentId: respondentId ?? null,
      status: "draft",
      definition: structuredClone(survey.publishedJson),
      data: {},
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
    };
    try {
      await orm.create("response", {
        id: row.id,
        surveyId: row.surveyId,
        respondentId: row.respondentId,
        status: row.status,
        definition: row.definition,
        data: row.data,
        submittedAt: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });
    } catch (error) {
      if (respondentId && isUniqueViolation(error)) {
        const open = await latestDraft({
          surveyId: survey.id,
          respondentId,
        });
        if (open) return { row: open, inserted: false };
      }
      throw error;
    }
    const saved = await readResponse(row.id);
    if (!saved) {
      throw APIError.from(
        "INTERNAL_SERVER_ERROR",
        SURVEY_ERROR_CODES.INTERNAL_ERROR,
      );
    }
    return { row: saved, inserted: true };
  }

  async function beginResponse(
    surveyId: string,
    respondentId: string | undefined,
    lifecycle: StartResponseLifecycle | undefined,
  ) {
    const fresh = await readSurvey(surveyId);
    if (!fresh || fresh.status !== "active" || !fresh.publishedJson) {
      throw notPublished();
    }
    assertSurveyAccepting(fresh.settings);
    if (!respondentId) {
      assertResponseLimit(fresh.settings, await countSubmitted(fresh.id));
      await lifecycle?.onStart?.(fresh);
      const created = await insertResponse(fresh);
      if (created.inserted) await lifecycle?.afterStart?.(created.row);
      return created.row;
    }
    return exclusive(draftKey(fresh.id, respondentId), async () => {
      const current = (await readSurvey(fresh.id)) ?? fresh;
      if (current.status !== "active" || !current.publishedJson) {
        throw notPublished();
      }
      assertSurveyAccepting(current.settings);
      const existing = existingResponseForStart({
        settings: current.settings,
        respondentId,
        openDraft: await latestDraft({
          surveyId: current.id,
          respondentId,
        }),
        latest: await latestResponse({
          surveyId: current.id,
          respondentId,
        }),
      });
      if (existing) return existing;
      assertResponseLimit(current.settings, await countSubmitted(current.id));
      await lifecycle?.onStart?.(current);
      const created = await insertResponse(current, respondentId);
      if (created.inserted) await lifecycle?.afterStart?.(created.row);
      return created.row;
    });
  }

  return {
    async getSurvey(idOrSlug) {
      return readSurvey(idOrSlug);
    },
    async listSurveys(query?: ListSurveysQuery) {
      const rows = await orm.findMany("survey", {
        where: query?.status
          ? (b) => b("status", "=", query.status as string)
          : undefined,
        orderBy: ["updatedAt", "desc"],
        limit: query?.limit,
        offset: query?.offset,
      });
      return rows.map((row) => toSurvey(row as SurveyRow));
    },
    async saveSurvey(input) {
      const existing = await readSurvey(input.id);
      const id = existing?.id ?? input.id;
      const slug = input.slug ?? existing?.slug ?? input.id;
      await assertSlugAvailable(id, slug);
      const now = new Date().toISOString();
      if (!existing) {
        if (input.expectedUpdatedAt) throw stale();
        return writeSurvey(
          {
            id: input.id,
            slug,
            status: "draft",
            draftJson: structuredClone(input.draftJson),
            publishedJson: null,
            publishedAt: null,
            settings: { ...DEFAULT_SURVEY_SETTINGS },
            createdAt: now,
            updatedAt: now,
          },
          undefined,
          true,
        );
      }
      return writeSurvey(
        {
          ...existing,
          slug,
          draftJson: structuredClone(input.draftJson),
          updatedAt: now,
        },
        input.expectedUpdatedAt,
        false,
      );
    },
    async publishSurvey(input) {
      const existing = await readSurvey(input.id);
      if (!existing) {
        throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.SURVEY_NOT_FOUND);
      }
      const now = new Date().toISOString();
      return writeSurvey(
        {
          ...existing,
          status: "active",
          publishedJson: structuredClone(existing.draftJson),
          publishedAt: now,
          updatedAt: now,
        },
        input.expectedUpdatedAt,
        false,
      );
    },
    async archiveSurvey(input) {
      const existing = await readSurvey(input.id);
      if (!existing) {
        throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.SURVEY_NOT_FOUND);
      }
      return writeSurvey(
        {
          ...existing,
          status: "archived",
          updatedAt: new Date().toISOString(),
        },
        input.expectedUpdatedAt,
        false,
      );
    },
    async saveSurveySettings(input: SaveSurveySettingsInput) {
      const existing = await readSurvey(input.id);
      if (!existing) {
        throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.SURVEY_NOT_FOUND);
      }
      return writeSurvey(
        {
          ...existing,
          settings: structuredClone(input.settings),
          updatedAt: new Date().toISOString(),
        },
        input.expectedUpdatedAt,
        false,
      );
    },
    async resumeSurvey(input: ResumeSurveyInput) {
      const existing = await readSurvey(input.id);
      if (!existing) {
        throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.SURVEY_NOT_FOUND);
      }
      if (existing.status === "active") return existing;
      if (existing.status === "archived" && existing.publishedJson !== null) {
        return writeSurvey(
          {
            ...existing,
            status: "active",
            updatedAt: new Date().toISOString(),
          },
          input.expectedUpdatedAt,
          false,
        );
      }
      throw notPublished();
    },
    async startResponse(input, lifecycle?: StartResponseLifecycle) {
      const survey = await readSurvey(input.surveyId);
      if (!survey) {
        throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.SURVEY_NOT_FOUND);
      }
      return exclusive(surveyKey(survey.id), () =>
        beginResponse(survey.id, input.respondentId, lifecycle),
      );
    },
    async getResponse(id) {
      return readResponse(id);
    },
    async listResponses(query?: ListResponsesQuery) {
      const include = query?.include === "full" ? "full" : "summary";
      const filtered = hasListResponseFilters(query);
      if (include === "summary") {
        const rows = await orm.findMany("response", {
          select: [...RESPONSE_SUMMARY_COLUMNS],
          where:
            filtered && query ? (b) => listResponseWhere(query, b) : undefined,
          orderBy: ["updatedAt", "desc"],
          limit: query?.limit,
          offset: query?.offset,
        });
        return rows.map((row) => toSummary(row as ResponseRow));
      }
      const rows = await orm.findMany("response", {
        where:
          filtered && query ? (b) => listResponseWhere(query, b) : undefined,
        orderBy: ["updatedAt", "desc"],
        limit: query?.limit,
        offset: query?.offset,
      });
      return rows.map((row) => toResponse(row as ResponseRow));
    },
    async countResponses(query?: ListResponsesQuery) {
      const filtered = hasListResponseFilters(query);
      return orm.count(
        "response",
        filtered && query
          ? { where: (b) => listResponseWhere(query, b) }
          : undefined,
      );
    },
    async savePartial(input) {
      const current = await readResponse(input.id);
      if (!current) {
        throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.RESPONSE_NOT_FOUND);
      }
      if (current.status !== "draft") {
        throw APIError.from("CONFLICT", SURVEY_ERROR_CODES.RESPONSE_CLOSED);
      }
      const survey = await readSurvey(current.surveyId);
      if (!survey) {
        throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.SURVEY_NOT_FOUND);
      }
      assertSurveyAccepting(survey.settings);
      return updateResponse(input.id, input.expectedUpdatedAt, (row) => {
        if (row.status !== "draft") {
          throw APIError.from("CONFLICT", SURVEY_ERROR_CODES.RESPONSE_CLOSED);
        }
        return { ...row, data: structuredClone(input.data) };
      });
    },
    async submitResponse(input, lifecycle) {
      const existing = await readResponse(input.id);
      if (!existing) {
        throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.RESPONSE_NOT_FOUND);
      }
      return exclusive(surveyKey(existing.surveyId), async () => {
        const current = await readResponse(input.id);
        if (!current) {
          throw APIError.from(
            "NOT_FOUND",
            SURVEY_ERROR_CODES.RESPONSE_NOT_FOUND,
          );
        }
        if (current.status === "submitted" && lifecycle?.alreadySubmitted) {
          return lifecycle.alreadySubmitted(current);
        }
        if (current.status !== "draft") {
          throw APIError.from("CONFLICT", SURVEY_ERROR_CODES.RESPONSE_CLOSED);
        }
        const survey = await readSurvey(current.surveyId);
        if (!survey) {
          throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.SURVEY_NOT_FOUND);
        }
        assertSurveyAccepting(survey.settings);
        assertResponseLimit(survey.settings, await countSubmitted(survey.id));
        if (
          input.expectedUpdatedAt !== undefined &&
          input.expectedUpdatedAt !== current.updatedAt
        ) {
          throw stale();
        }
        const prepared = lifecycle?.prepare
          ? await lifecycle.prepare(current)
          : undefined;
        const data = structuredClone(prepared ?? input.data ?? current.data);
        const saved = await updateResponse(
          input.id,
          input.expectedUpdatedAt,
          (row) => {
            if (row.status !== "draft") {
              throw APIError.from(
                "CONFLICT",
                SURVEY_ERROR_CODES.RESPONSE_CLOSED,
              );
            }
            const now = new Date().toISOString();
            return {
              ...row,
              data,
              status: "submitted",
              submittedAt: now,
              updatedAt: now,
            };
          },
        );
        await lifecycle?.afterSubmit?.(saved);
        return saved;
      });
    },
    async abandonResponse(input) {
      return updateResponse(input.id, input.expectedUpdatedAt, (current) => {
        if (current.status !== "draft") {
          throw APIError.from("CONFLICT", SURVEY_ERROR_CODES.RESPONSE_CLOSED);
        }
        return { ...current, status: "abandoned" };
      });
    },
    async reopenResponse(input) {
      const existing = await readResponse(input.id);
      if (!existing) {
        throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.RESPONSE_NOT_FOUND);
      }
      const survey = await readSurvey(existing.surveyId);
      if (!survey) {
        throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.SURVEY_NOT_FOUND);
      }
      assertReopenAllowed(survey.settings);
      const run = async () => {
        if (existing.respondentId) {
          const open = await latestDraft({
            surveyId: existing.surveyId,
            respondentId: existing.respondentId,
          });
          if (open && open.id !== existing.id) throw openDraft();
        }
        try {
          return await updateResponse(
            input.id,
            input.expectedUpdatedAt,
            (current) => {
              if (current.status === "draft") {
                throw APIError.from(
                  "CONFLICT",
                  SURVEY_ERROR_CODES.RESPONSE_CLOSED,
                );
              }
              return { ...current, status: "draft", submittedAt: null };
            },
          );
        } catch (error) {
          if (isUniqueViolation(error)) throw openDraft();
          throw error;
        }
      };
      if (!existing.respondentId) return run();
      return exclusive(draftKey(existing.surveyId, existing.respondentId), run);
    },
  };

  async function updateResponse(
    id: string,
    expectedUpdatedAt: string | undefined,
    change: (current: ResponseRecord) => ResponseRecord,
  ) {
    const currentRow = await orm.findFirst("response", {
      where: (b) => b("id", "=", id),
    });
    if (!currentRow) {
      throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.RESPONSE_NOT_FOUND);
    }
    const current = toResponse(currentRow as ResponseRow);
    const next = change(current);
    const updatedAt =
      next.updatedAt === current.updatedAt
        ? new Date().toISOString()
        : next.updatedAt;
    const row = { ...next, updatedAt, definition: current.definition };
    const set = {
      respondentId: row.respondentId,
      status: row.status,
      data: row.data,
      submittedAt: row.submittedAt ? new Date(row.submittedAt) : null,
      updatedAt: new Date(row.updatedAt),
    };
    if (expectedUpdatedAt !== undefined) {
      await orm.updateMany("response", {
        set,
        where: (b) =>
          b.and(
            b("id", "=", id),
            b("updatedAt", "=", new Date(expectedUpdatedAt)),
          ),
      });
      const fresh = await orm.findFirst("response", {
        where: (b) => b("id", "=", id),
      });
      if (!fresh) throw stale();
      const saved = toResponse(fresh as ResponseRow);
      if (!responseWriteLanded(saved, row)) throw stale();
      return saved;
    }
    await orm.updateMany("response", {
      set,
      where: (b) => b("id", "=", id),
    });
    const fresh = await orm.findFirst("response", {
      where: (b) => b("id", "=", id),
    });
    if (!fresh) {
      throw APIError.from("NOT_FOUND", SURVEY_ERROR_CODES.RESPONSE_NOT_FOUND);
    }
    return toResponse(fresh as ResponseRow);
  }

  async function assertSlugAvailable(id: string, slug: string) {
    const bySlug = await orm.findFirst("survey", {
      where: (b) => b("slug", "=", slug),
    });
    if (bySlug && (bySlug as SurveyRow).id !== id) throw slugTaken();
    if (slug === id) return;
    const byId = await orm.findFirst("survey", {
      where: (b) => b("id", "=", slug),
    });
    if (byId && (byId as SurveyRow).id !== id) throw slugTaken();
  }
}
