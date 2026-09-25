import {
  SURVEY_ERROR_CODES,
  APIError,
  type ListResponsesQuery,
  type ListSurveysQuery,
  type ResponseRecord,
  type ResponseSummary,
  type SurveyRecord,
  type SurveyStore,
} from "@dimah-survey/core";
import type { InferFumaDB } from "fumadb";

import { v1, type DimahSurveyDB } from "./fuma-db";

export type DimahSurveyDbClient = InferFumaDB<typeof DimahSurveyDB>;

type SurveyRow = {
  id: string;
  slug: string;
  status: string;
  draftJson: SurveyRecord["draftJson"];
  publishedJson: SurveyRecord["publishedJson"];
  publishedAt: Date | string | null;
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
    draftJson: row.draftJson,
    publishedJson: row.publishedJson,
    publishedAt: isoOrNull(row.publishedAt),
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
    definition: row.definition,
    data: row.data,
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

function sameSecond(left: string, right: string) {
  const a = Date.parse(left);
  const b = Date.parse(right);
  if (Number.isNaN(a) || Number.isNaN(b)) return left === right;
  return Math.abs(a - b) < 1000;
}

export function db(client: DimahSurveyDbClient): SurveyStore {
  const orm = client.orm(v1.version);

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
      updatedAt,
    };
    if (expectedUpdatedAt !== undefined) {
      await orm.updateMany("survey", {
        set: columns,
        where: (b) =>
          b.and(
            b("id", "=", row.id),
            b("updatedAt", "=", new Date(expectedUpdatedAt)),
          ),
      });
      const fresh = await readSurvey(row.id);
      if (!fresh || sameSecond(fresh.updatedAt, expectedUpdatedAt))
        throw stale();
      return fresh;
    }
    if (creating) {
      await orm.create("survey", {
        id: row.id,
        ...columns,
        createdAt: new Date(row.createdAt),
      });
      return row;
    }
    await orm.updateMany("survey", {
      set: columns,
      where: (b) => b("id", "=", row.id),
    });
    return row;
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
    async findLatestDraft(query) {
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
    },
    async saveSurvey(input) {
      const existing = await readSurvey(input.id);
      const now = new Date().toISOString();
      if (!existing) {
        if (input.expectedUpdatedAt) throw stale();
        return writeSurvey(
          {
            id: input.id,
            slug: input.slug ?? input.id,
            status: "draft",
            draftJson: input.draftJson,
            publishedJson: null,
            publishedAt: null,
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
          slug: input.slug ?? existing.slug,
          draftJson: input.draftJson,
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
    async startResponse(input) {
      const survey = await readSurvey(input.surveyId);
      if (!survey || survey.status !== "active" || !survey.publishedJson) {
        throw APIError.from("CONFLICT", SURVEY_ERROR_CODES.NOT_PUBLISHED);
      }
      const now = new Date().toISOString();
      const row: ResponseRecord = {
        id: crypto.randomUUID(),
        surveyId: survey.id,
        respondentId: input.respondentId ?? null,
        status: "draft",
        definition: structuredClone(survey.publishedJson),
        data: {},
        createdAt: now,
        updatedAt: now,
        submittedAt: null,
      };
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
      return row;
    },
    async getResponse(id) {
      const row = await orm.findFirst("response", {
        where: (b) => b("id", "=", id),
      });
      return row ? toResponse(row as ResponseRow) : null;
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
      const rows = await orm.findMany("response", {
        select: ["id"],
        where:
          filtered && query ? (b) => listResponseWhere(query, b) : undefined,
      });
      return rows.length;
    },
    async savePartial(input) {
      return updateResponse(input.id, input.expectedUpdatedAt, (current) => {
        if (current.status !== "draft") {
          throw APIError.from("CONFLICT", SURVEY_ERROR_CODES.RESPONSE_CLOSED);
        }
        return { ...current, data: input.data };
      });
    },
    async submitResponse(input) {
      return updateResponse(input.id, input.expectedUpdatedAt, (current) => {
        if (current.status !== "draft") {
          throw APIError.from("CONFLICT", SURVEY_ERROR_CODES.RESPONSE_CLOSED);
        }
        const now = new Date().toISOString();
        return {
          ...current,
          data: input.data ?? current.data,
          status: "submitted",
          submittedAt: now,
          updatedAt: now,
        };
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
      return updateResponse(input.id, input.expectedUpdatedAt, (current) => {
        if (current.status === "draft") {
          throw APIError.from("CONFLICT", SURVEY_ERROR_CODES.RESPONSE_CLOSED);
        }
        return { ...current, status: "draft", submittedAt: null };
      });
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
      if (
        !fresh ||
        sameSecond(iso((fresh as ResponseRow).updatedAt), expectedUpdatedAt)
      ) {
        throw stale();
      }
      return toResponse(fresh as ResponseRow);
    } else {
      await orm.updateMany("response", {
        set,
        where: (b) => b("id", "=", id),
      });
    }
    return row;
  }
}
