import type { SurveyApiOperation } from "./routes";

/** Opaque SurveyJS survey JSON. This library does not define question types. */
export type SurveyJson = Record<string, unknown>;

/** Opaque SurveyJS `survey.data` object. Partial save replaces it. */
export type SurveyResult = Record<string, unknown>;

export type SurveyStatus = "draft" | "active" | "archived";

export type ResponseStatus = "draft" | "submitted" | "abandoned";

/** How an identified respondent may hold responses. Anonymous starts always insert. */
export type SurveyResponsePolicy = "one-open" | "single";

/**
 * Collection rules for one survey. Not part of SurveyJS JSON and not copied
 * onto `response.definition`.
 */
export type SurveySettings = {
  responses: SurveyResponsePolicy;
  reopen: boolean;
  opensAt: string | null;
  closesAt: string | null;
  /** Maximum `submitted` rows. `null` means no cap. */
  maxResponses: number | null;
};

export type SurveyRecord = {
  id: string;
  slug: string;
  status: SurveyStatus;
  draftJson: SurveyJson;
  publishedJson: SurveyJson | null;
  publishedAt: string | null;
  settings: SurveySettings;
  createdAt: string;
  updatedAt: string;
};

/** Active published document. `draftJson` is absent. */
export type PublishedSurvey = {
  id: string;
  slug: string;
  publishedJson: SurveyJson;
  publishedAt: string;
  settings: SurveySettings;
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

export type SaveSurveySettingsInput = {
  id: string;
  settings: SurveySettings;
  expectedUpdatedAt?: string;
};

export type ResumeSurveyInput = {
  id: string;
  expectedUpdatedAt?: string;
};

export type StartResponseInput = {
  surveyId: string;
  /**
   * When set, `responses: "one-open"` returns the open draft and
   * `responses: "single"` returns the latest row of any status.
   * A new row is inserted only when that lookup misses. Omit it to always insert.
   */
  respondentId?: string;
};

/**
 * Store callbacks for `startResponse`. The HTTP body does not carry them.
 * Both run inside the store lock. `onStart` runs only before a new insert.
 */
export type StartResponseLifecycle = {
  onStart?: (survey: SurveyRecord) => void | Promise<void>;
  afterStart?: (response: ResponseRecord) => void | Promise<void>;
};

/**
 * Store callbacks for `submitResponse`. The HTTP body does not carry them.
 * All of them run inside the store lock. `prepare` runs only for a draft,
 * after the window, cap, and `expectedUpdatedAt` checks. Throw to skip the
 * write. `alreadySubmitted` runs when the row is already submitted and must
 * not call submit hooks. `afterSubmit` runs after the row is stored; a throw
 * leaves the row stored.
 */
export type SubmitResponseLifecycle = {
  prepare?: (
    current: ResponseRecord,
  ) => SurveyResult | void | Promise<SurveyResult | void>;
  alreadySubmitted?: (
    current: ResponseRecord,
  ) => ResponseRecord | Promise<ResponseRecord>;
  afterSubmit?: (response: ResponseRecord) => void | Promise<void>;
};

export type ListPageQuery = {
  limit?: number;
  offset?: number;
};

export type ListSurveysQuery = ListPageQuery & {
  status?: SurveyStatus;
};

export type ListResponsesQuery = ListPageQuery & {
  surveyId?: string;
  respondentId?: string;
  status?: ResponseStatus;
  /** Inclusive lower bound on `submittedAt`. Rows with no submit time are excluded. */
  submittedFrom?: string;
  /** Inclusive upper bound on `submittedAt`. Rows with no submit time are excluded. */
  submittedTo?: string;
  /** Exclusive lower bound on `updatedAt`. */
  updatedAfter?: string;
  /** `"summary"` omits `definition` and `data`. Default is `"summary"`. */
  include?: "summary" | "full";
};

/** List row when `include` is `"summary"`. `definition` and `data` are omitted. */
export type ResponseSummary = {
  id: string;
  surveyId: string;
  respondentId: string | null;
  status: ResponseStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
};

export type SurveyList = {
  surveys: SurveyRecord[];
  limit: number;
  offset: number;
  nextOffset: number | null;
};

export type ResponseList = {
  responses: (ResponseRecord | ResponseSummary)[];
  limit: number;
  offset: number;
  nextOffset: number | null;
  total: number;
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

export type Operation = SurveyApiOperation;

export type GuardContext = {
  request?: Request;
  operation: Operation;
  /** Parsed JSON body, when the operation has one. */
  body?: unknown;
  /** Parsed query, when the operation has one. */
  query?: unknown;
};

/**
 * Logged-in fill caller. The server stamps `respondentId` onto start and list,
 * and refuses `include: "full"` and any other respondent's row.
 */
export type SurveyPrincipal = {
  respondentId: string;
};

/** Public fill caller. The response id is the capability. List is refused. */
export type AnonymousPrincipal = {
  anonymous: true;
};

export type FillPrincipal = SurveyPrincipal | AnonymousPrincipal;

export type ValidateResultInput = {
  definition: SurveyJson;
  data: SurveyResult;
};

/** Return the cleaned `survey.data` to persist it. Omit the return to keep `data`. */
export type ValidateResult = (
  input: ValidateResultInput,
) => SurveyResult | void | Promise<SurveyResult | void>;

export type SurveyStore = {
  saveSurvey(input: SaveSurveyInput): Promise<SurveyRecord>;
  publishSurvey(input: PublishSurveyInput): Promise<SurveyRecord>;
  archiveSurvey(input: ArchiveSurveyInput): Promise<SurveyRecord>;
  saveSurveySettings(input: SaveSurveySettingsInput): Promise<SurveyRecord>;
  /**
   * Archived survey with `publishedJson` becomes `active` again.
   * Does not copy `draftJson`. An active survey is returned unchanged.
   */
  resumeSurvey(input: ResumeSurveyInput): Promise<SurveyRecord>;
  getSurvey(idOrSlug: string): Promise<SurveyRecord | null>;
  listSurveys(query?: ListSurveysQuery): Promise<SurveyRecord[]>;
  startResponse(
    input: StartResponseInput,
    lifecycle?: StartResponseLifecycle,
  ): Promise<ResponseRecord>;
  listResponses(
    query?: ListResponsesQuery,
  ): Promise<(ResponseRecord | ResponseSummary)[]>;
  /** Ignores `limit`, `offset`, and `include`. */
  countResponses(query?: ListResponsesQuery): Promise<number>;
  savePartial(input: SavePartialInput): Promise<ResponseRecord>;
  submitResponse(
    input: SubmitResponseInput,
    lifecycle?: SubmitResponseLifecycle,
  ): Promise<ResponseRecord>;
  abandonResponse(input: ResponseMutationInput): Promise<ResponseRecord>;
  reopenResponse(input: ResponseMutationInput): Promise<ResponseRecord>;
  getResponse(id: string): Promise<ResponseRecord | null>;
};
