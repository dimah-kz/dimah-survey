import { LIST_DEFAULT_LIMIT } from "./schemas";
import type {
  ListPageQuery,
  ResponseData,
  ResponseRecord,
  ResponseSummary,
} from "./types";

export function normalizeListPage(query: ListPageQuery = {}) {
  return {
    limit: query.limit ?? LIST_DEFAULT_LIMIT,
    offset: query.offset ?? 0,
  };
}

/** `rows` must be fetched as `limit + 1` to detect the next page. */
export function pageFromOverfetch<T>(
  rows: readonly T[],
  limit: number,
  offset: number,
) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : [...rows];
  return {
    items,
    nextOffset: hasMore ? offset + items.length : null,
  };
}

export function toResponseSummary(
  row: ResponseRecord | ResponseSummary | ResponseData,
): ResponseSummary {
  return {
    id: row.id,
    surveyId: row.surveyId,
    respondentId: row.respondentId,
    status: row.status,
    versionId: row.versionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    submittedAt: row.submittedAt,
  };
}

/** Analytics row. The SurveyJS document is returned once per version. */
export function toResponseData(
  row: ResponseRecord | ResponseData,
): ResponseData {
  return {
    ...toResponseSummary(row),
    data: row.data,
  };
}
