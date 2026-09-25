import { LIST_DEFAULT_LIMIT } from "./schemas";
import type { ListPageQuery, ResponseRecord, ResponseSummary } from "./types";

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
  row: ResponseRecord | ResponseSummary,
): ResponseSummary {
  return {
    id: row.id,
    surveyId: row.surveyId,
    respondentId: row.respondentId,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    submittedAt: row.submittedAt,
  };
}
