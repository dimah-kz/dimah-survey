import type { SurveyJson } from "@dimah-survey/core";

export const welcomeSurvey: SurveyJson = {
  title: "Weekly pulse",
  description: "Two short pages. The first one is saved before you finish.",
  showProgressBar: "top",
  showQuestionNumbers: "off",
  pages: [
    {
      name: "week",
      title: "The week",
      elements: [
        {
          type: "rating",
          name: "week",
          title: "How was this week?",
          isRequired: true,
          rateMin: 1,
          rateMax: 5,
          minRateDescription: "Rough",
          maxRateDescription: "Great",
        },
      ],
    },
    {
      name: "note",
      title: "A note",
      elements: [
        {
          type: "radiogroup",
          name: "again",
          title: "Should we run this again next week?",
          isRequired: true,
          choices: ["Yes", "Not sure", "No"],
        },
        {
          type: "comment",
          name: "note",
          title: "Anything else?",
          rows: 3,
        },
      ],
    },
  ],
};

export function blankSurvey(title: string): SurveyJson {
  return {
    title,
    pages: [{ name: "page1", elements: [] }],
  };
}

export function slugFromTitle(title: string) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug.length > 0 ? slug : "survey";
}
