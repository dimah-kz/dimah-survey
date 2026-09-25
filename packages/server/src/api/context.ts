import type { DimahSurveyConfig } from "@/dimah-survey";

export type SurveyEndpointContext = {
  config: DimahSurveyConfig;
  request: Request;
};
