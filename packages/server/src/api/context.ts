import type { ResolvedDimahSurveyConfig } from "@/dimah-survey";

export type SurveyEndpointContext = {
  config: ResolvedDimahSurveyConfig;
  request: Request;
};
