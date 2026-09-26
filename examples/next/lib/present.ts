import type { SurveyJson, SurveyRecord } from "@dimah-survey/core";

export function surveyTitle(json: SurveyJson, fallback: string) {
  const title = json.title;
  if (typeof title === "string" && title.trim().length > 0) return title.trim();
  return fallback;
}

export function questionCount(json: SurveyJson) {
  const pages = json.pages;
  if (!Array.isArray(pages)) return 0;
  return pages.reduce((count, page) => {
    if (!page || typeof page !== "object" || !("elements" in page)) {
      return count;
    }
    const elements = page.elements;
    return count + (Array.isArray(elements) ? elements.length : 0);
  }, 0);
}

export function questionLabel(count: number) {
  return count === 1 ? "1 question" : `${count} questions`;
}

export function formatWhen(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function hasUnpublishedEdits(survey: SurveyRecord) {
  if (survey.status !== "active" || survey.publishedJson === null) return false;
  return (
    JSON.stringify(survey.draftJson) !== JSON.stringify(survey.publishedJson)
  );
}
