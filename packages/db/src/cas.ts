import type { ResponseRecord, SurveyRecord } from "@dimah-survey/core";

/** SQL timestamps often drop sub-second precision on the way back out. */
export function sameInstant(left: string, right: string) {
  const a = Date.parse(left);
  const b = Date.parse(right);
  if (Number.isNaN(a) || Number.isNaN(b)) return left === right;
  return Math.abs(a - b) < 1000;
}

function sameInstantOrNull(left: string | null, right: string | null) {
  if (left == null || right == null) return left == null && right == null;
  return sameInstant(left, right);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const body = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",");
    return `{${body}}`;
  }
  return JSON.stringify(value);
}

function jsonEqual(left: unknown, right: unknown) {
  return stableJson(left) === stableJson(right);
}

/**
 * The conditional update landed when the row read back is the row we wrote.
 * Matching the previous token marks a fast successful write as stale, and a
 * lost race as success.
 */
export function surveyWriteLanded(fresh: SurveyRecord, written: SurveyRecord) {
  return (
    fresh.slug === written.slug &&
    fresh.status === written.status &&
    sameInstant(fresh.updatedAt, written.updatedAt) &&
    sameInstantOrNull(fresh.publishedAt, written.publishedAt) &&
    jsonEqual(fresh.draftJson, written.draftJson) &&
    jsonEqual(fresh.publishedJson, written.publishedJson)
  );
}

export function responseWriteLanded(
  fresh: ResponseRecord,
  written: ResponseRecord,
) {
  return (
    fresh.status === written.status &&
    fresh.respondentId === written.respondentId &&
    sameInstant(fresh.updatedAt, written.updatedAt) &&
    sameInstantOrNull(fresh.submittedAt, written.submittedAt) &&
    jsonEqual(fresh.data, written.data) &&
    jsonEqual(fresh.definition, written.definition)
  );
}
