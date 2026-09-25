export const routes = {
  survey: (id: string) => `/surveys/${encodeURIComponent(id)}`,
  publish: (id: string) => `/surveys/${encodeURIComponent(id)}/publish`,
  archive: (id: string) => `/surveys/${encodeURIComponent(id)}/archive`,
  responses: (surveyId: string) =>
    `/surveys/${encodeURIComponent(surveyId)}/responses`,
  response: (id: string) => `/responses/${encodeURIComponent(id)}`,
  submit: (id: string) => `/responses/${encodeURIComponent(id)}/submit`,
  abandon: (id: string) => `/responses/${encodeURIComponent(id)}/abandon`,
  reopen: (id: string) => `/responses/${encodeURIComponent(id)}/reopen`,
} as const;
