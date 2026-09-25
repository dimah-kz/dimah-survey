export type DimahSurveyHandlerSource = {
  handler: (request: Request) => Promise<Response>;
};
