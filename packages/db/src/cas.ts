import {
  sameJson,
  type ResponseRecord,
  type SurveyRecord,
} from "@dimah-survey/core";

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
    sameJson(fresh.draftJson, written.draftJson) &&
    sameJson(fresh.publishedJson, written.publishedJson)
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
    sameJson(fresh.data, written.data) &&
    sameJson(fresh.definition, written.definition)
  );
}
