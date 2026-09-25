/** Opaque SurveyJS survey JSON. This library does not define question types. */
export type SurveyJson = Record<string, unknown>;

/** Opaque SurveyJS `survey.data` object. Partial save replaces it. */
export type SurveyResult = Record<string, unknown>;

export type SurveyStatus = "draft" | "active" | "archived";

export type ResponseStatus = "draft" | "submitted" | "abandoned";

export type SurveyRecord = {
  id: string;
  slug: string;
  status: SurveyStatus;
  draftJson: SurveyJson;
  publishedJson: SurveyJson | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResponseRecord = {
  id: string;
  surveyId: string;
  respondentId: string | null;
  status: ResponseStatus;
  /** Copy of `publishedJson` at start. Later publishes must not change it. */
  definition: SurveyJson;
  data: SurveyResult;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
};

export type SaveSurveyInput = {
  id: string;
  slug?: string;
  draftJson: SurveyJson;
  expectedUpdatedAt?: string;
};

export type PublishSurveyInput = {
  id: string;
  expectedUpdatedAt?: string;
};

export type ArchiveSurveyInput = {
  id: string;
  expectedUpdatedAt?: string;
};

export type StartResponseInput = {
  surveyId: string;
  respondentId?: string;
};

export type SavePartialInput = {
  id: string;
  data: SurveyResult;
  expectedUpdatedAt?: string;
};

export type SubmitResponseInput = {
  id: string;
  data?: SurveyResult;
  expectedUpdatedAt?: string;
};

export type ResponseMutationInput = {
  id: string;
  expectedUpdatedAt?: string;
};

export type Operation =
  | "saveSurvey"
  | "publishSurvey"
  | "archiveSurvey"
  | "getSurvey"
  | "startResponse"
  | "savePartial"
  | "submitResponse"
  | "abandonResponse"
  | "reopenResponse"
  | "getResponse";

export type GuardContext = {
  request?: Request;
  operation: Operation;
};

export type ValidateResultInput = {
  definition: SurveyJson;
  data: SurveyResult;
};

export type SurveyStore = {
  saveSurvey(input: SaveSurveyInput): Promise<SurveyRecord>;
  publishSurvey(input: PublishSurveyInput): Promise<SurveyRecord>;
  archiveSurvey(input: ArchiveSurveyInput): Promise<SurveyRecord>;
  getSurvey(idOrSlug: string): Promise<SurveyRecord | null>;
  startResponse(input: StartResponseInput): Promise<ResponseRecord>;
  savePartial(input: SavePartialInput): Promise<ResponseRecord>;
  submitResponse(input: SubmitResponseInput): Promise<ResponseRecord>;
  abandonResponse(input: ResponseMutationInput): Promise<ResponseRecord>;
  reopenResponse(input: ResponseMutationInput): Promise<ResponseRecord>;
  getResponse(id: string): Promise<ResponseRecord | null>;
};
