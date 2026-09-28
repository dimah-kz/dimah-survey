import type { SurveyApiOperation } from "./routes";

/** Opaque SurveyJS survey JSON. This library does not define question types. */
export type SurveyJson = Record<string, unknown>;

/** Opaque SurveyJS `survey.data` object. Partial save replaces it. */
export type SurveyResult = Record<string, unknown>;

/** `draft` is unpublished. `active` can collect. `archived` keeps the published document. */
export type SurveyStatus = "draft" | "active" | "archived";

/** `draft` can still change. `submitted` passed validation. `abandoned` closed without submit. */
export type ResponseStatus = "draft" | "submitted" | "abandoned";

/** How an identified respondent may hold responses. Anonymous starts always insert. */
export type SurveyResponsePolicy = "one-open" | "single";

/**
 * Collection rules for one survey. Not part of SurveyJS JSON and not stored
 * on a published version.
 *
 * `saveSurvey` inserts `DEFAULT_SURVEY_SETTINGS` once.
 * `saveSurveySettings` replaces the whole object.
 */
export type SurveySettings = {
  /**
   * Reuse policy for identified respondents. Anonymous starts always insert.
   * @default "one-open"
   */
  responses: SurveyResponsePolicy;
  /**
   * Whether a submitted or abandoned response may return to `draft`.
   * @default true
   */
  reopen: boolean;
  /**
   * Inclusive start of collection, as an ISO datetime. `null` means no start.
   * @default null
   */
  opensAt: string | null;
  /**
   * Inclusive end of collection, as an ISO datetime. `null` means no end.
   * Must be later than `opensAt` when both are set.
   * @default null
   */
  closesAt: string | null;
  /**
   * Maximum number of `submitted` rows. `null` means no cap.
   * @default null
   */
  maxResponses: number | null;
};

/**
 * One immutable published document.
 * A later publish does not update this row.
 */
export type SurveyVersion = {
  /** Version row id. */
  id: string;
  /** Survey this version belongs to. */
  surveyId: string;
  /** SurveyJS document frozen at publish. */
  definition: SurveyJson;
  /** Canonical hash of `definition`. Identical publishes reuse the row. */
  contentHash: string;
  /** When this version was first published. */
  createdAt: string;
};

/** Stored survey. `draftJson`, the current version, and `settings` stay independent. */
export type SurveyRecord = {
  /** Application-chosen id. */
  id: string;
  /** Unique public identifier. Defaults to `id` when omitted on create. */
  slug: string;
  /** `draft`, `active`, or `archived`. */
  status: SurveyStatus;
  /** Editable SurveyJS document. `saveSurvey` replaces this and does not publish. */
  draftJson: SurveyJson;
  /** Current published version. `null` before the first publish. */
  publishedVersionId: string | null;
  /** Document of `publishedVersionId`. `null` before the first publish. */
  publishedJson: SurveyJson | null;
  /** When the current version was last promoted. `null` before the first publish. */
  publishedAt: string | null;
  /** Server-owned collection policy. Not copied into SurveyJS JSON. */
  settings: SurveySettings;
  /** When the row was inserted. */
  createdAt: string;
  /** Compare-and-swap token for later writes. */
  updatedAt: string;
};

/** Active published document. `draftJson` is absent. */
export type PublishedSurvey = {
  /** Application-chosen id. */
  id: string;
  /** Unique public identifier. */
  slug: string;
  /** Current published version. */
  publishedVersionId: string;
  /** Document new responses start from. */
  publishedJson: SurveyJson;
  /** When the current version was last promoted. */
  publishedAt: string;
  /** Server-owned collection policy. Not copied into SurveyJS JSON. */
  settings: SurveySettings;
};

/** One response. `definition` is the version it started on. */
export type ResponseRecord = {
  /** Response row id. */
  id: string;
  /** Survey this response belongs to. */
  surveyId: string;
  /** Stamped owner. `null` for an anonymous response. */
  respondentId: string | null;
  /** `draft`, `submitted`, or `abandoned`. */
  status: ResponseStatus;
  /** Published version captured at start. Later publishes must not change it. */
  versionId: string;
  /** Document of `versionId`, joined for a single-response read. */
  definition: SurveyJson;
  /** Stored `survey.data`. Partial save replaces the whole object. */
  data: SurveyResult;
  /** When the row was inserted. */
  createdAt: string;
  /** Compare-and-swap token for later writes. */
  updatedAt: string;
  /** When status became `submitted`. Cleared on reopen. */
  submittedAt: string | null;
};

export type SaveSurveyInput = {
  id: string;
  /** Unique public id. Defaults to `id` on create. */
  slug?: string;
  /** SurveyJS document to store as the draft. Does not publish. */
  draftJson: SurveyJson;
  /** Compare-and-swap token. A mismatch fails with `STALE_UPDATE`. */
  expectedUpdatedAt?: string;
};

export type PublishSurveyInput = {
  id: string;
  /** Compare-and-swap token. A mismatch fails with `STALE_UPDATE`. */
  expectedUpdatedAt?: string;
};

export type ArchiveSurveyInput = {
  id: string;
  /** Compare-and-swap token. A mismatch fails with `STALE_UPDATE`. */
  expectedUpdatedAt?: string;
};

export type SaveSurveySettingsInput = {
  id: string;
  /** Complete settings object. Omitted keys are not preserved. */
  settings: SurveySettings;
  /** Compare-and-swap token. A mismatch fails with `STALE_UPDATE`. */
  expectedUpdatedAt?: string;
};

export type ResumeSurveyInput = {
  id: string;
  /** Compare-and-swap token. A mismatch fails with `STALE_UPDATE`. */
  expectedUpdatedAt?: string;
};

export type StartResponseInput = {
  /** Survey id or slug. The survey must be `active`. */
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
 * Both run inside the store lock. A resumed row skips both.
 */
export type StartResponseLifecycle = {
  /** Before a new insert. Throw to abort the insert. */
  onStart?: (survey: SurveyRecord) => void | Promise<void>;
  /** After a new insert. A throw leaves the row stored. */
  afterStart?: (response: ResponseRecord) => void | Promise<void>;
};

/**
 * Store callbacks for `submitResponse`. The HTTP body does not carry them.
 * All of them run inside the store lock.
 */
export type SubmitResponseLifecycle = {
  /**
   * Draft only, after the window, cap, and `expectedUpdatedAt` checks.
   * Return the object to persist. Throw to skip the write.
   */
  prepare?: (
    current: ResponseRecord,
  ) => SurveyResult | void | Promise<SurveyResult | void>;
  /**
   * The row is already `submitted`. Do not call submit hooks.
   * Return the row to send back.
   */
  alreadySubmitted?: (
    current: ResponseRecord,
  ) => ResponseRecord | Promise<ResponseRecord>;
  /** After the row is stored. A throw leaves the row stored. */
  afterSubmit?: (response: ResponseRecord) => void | Promise<void>;
};

export type ListPageQuery = {
  /**
   * Page size. Accepted range is 1–100.
   * @default 50
   */
  limit?: number;
  /**
   * Rows to skip.
   * @default 0
   */
  offset?: number;
};

/** `listSurveys` filter. Rows sort by `updatedAt` descending. */
export type ListSurveysQuery = ListPageQuery & {
  /** `draft`, `active`, or `archived`. */
  status?: SurveyStatus;
};

/** `listSurveyVersions` filter. Rows sort by `createdAt` descending. */
export type ListSurveyVersionsQuery = ListPageQuery & {
  /** Survey id or slug. The handler resolves a slug before the store sees it. */
  surveyId: string;
};

/**
 * `listResponses` filter. Rows sort by `updatedAt` descending.
 * `countResponses` ignores `limit`, `offset`, and `include`.
 */
export type ListResponsesQuery = ListPageQuery & {
  /** Limit the page to one survey. */
  surveyId?: string;
  /**
   * Limit the page to one respondent.
   * Fill replaces this with the guarded id.
   */
  respondentId?: string;
  /** `draft`, `submitted`, or `abandoned`. */
  status?: ResponseStatus;
  /** Inclusive lower bound on `submittedAt`. Rows with no submit time are excluded. */
  submittedFrom?: string;
  /** Inclusive upper bound on `submittedAt`. Rows with no submit time are excluded. */
  submittedTo?: string;
  /** Exclusive lower bound on `updatedAt`. */
  updatedAfter?: string;
  /**
   * `"summary"` omits `data`. `"full"` adds `data` and returns each
   * referenced version once. Fill refuses `"full"`.
   * @default "summary"
   */
  include?: "summary" | "full";
};

/** List row when `include` is `"summary"`. `data` is omitted. */
export type ResponseSummary = {
  /** Response row id. */
  id: string;
  /** Survey this response belongs to. */
  surveyId: string;
  /** Stamped owner. `null` for an anonymous response. */
  respondentId: string | null;
  /** `draft`, `submitted`, or `abandoned`. */
  status: ResponseStatus;
  /** Published version captured at start. */
  versionId: string;
  /** When the row was inserted. */
  createdAt: string;
  /** Compare-and-swap token for later writes. */
  updatedAt: string;
  /** When status became `submitted`. Cleared on reopen. */
  submittedAt: string | null;
};

/** List row when `include` is `"full"`. The definition lives on `versions`. */
export type ResponseData = ResponseSummary & {
  /** Stored `survey.data`. */
  data: SurveyResult;
};

/** One page of published versions, `createdAt` descending. */
export type SurveyVersionList = {
  /** Versions on this page. */
  versions: SurveyVersion[];
  /** Page size that produced this result. */
  limit: number;
  /** Rows skipped before this page. */
  offset: number;
  /** Offset of the next page. `null` when this page is the last. */
  nextOffset: number | null;
};

/** One page of surveys, `updatedAt` descending. */
export type SurveyList = {
  /** Surveys on this page. */
  surveys: SurveyRecord[];
  /** Page size that produced this result. */
  limit: number;
  /** Rows skipped before this page. */
  offset: number;
  /** Offset of the next page. `null` when this page is the last. */
  nextOffset: number | null;
};

/** One page of responses. `total` ignores `limit` and `offset`. */
export type ResponseList = {
  /**
   * Rows on this page.
   * `"summary"` omits `data`. `"full"` includes `data` and omits `definition`.
   */
  responses: (ResponseSummary | ResponseData)[];
  /**
   * Versions referenced by this page when `include` is `"full"`.
   * Empty for a summary page. Sorted by `createdAt` ascending.
   */
  versions: SurveyVersion[];
  /** Page size that produced this result. */
  limit: number;
  /** Rows skipped before this page. */
  offset: number;
  /** Offset of the next page. `null` when this page is the last. */
  nextOffset: number | null;
  /** Matching rows, ignoring `limit` and `offset`. */
  total: number;
};

export type SavePartialInput = {
  id: string;
  /** Replaces the stored `data` object. Not a key patch. */
  data: SurveyResult;
  /** Compare-and-swap token. A mismatch fails with `STALE_UPDATE`. */
  expectedUpdatedAt?: string;
};

export type SubmitResponseInput = {
  id: string;
  /**
   * Payload `validateResult` checks. Omit to submit the stored `data`.
   * A repeated submit must match the stored object.
   */
  data?: SurveyResult;
  /** Compare-and-swap token. A mismatch fails with `STALE_UPDATE`. */
  expectedUpdatedAt?: string;
};

/** `abandonResponse` and `reopenResponse` input. */
export type ResponseMutationInput = {
  id: string;
  /** Compare-and-swap token. A mismatch fails with `STALE_UPDATE`. */
  expectedUpdatedAt?: string;
};

export type Operation = SurveyApiOperation;

/** Argument to `dimahSurvey({ guard })`. */
export type GuardContext = {
  /** Present for HTTP calls. Absent for in-process calls without a request. */
  request?: Request;
  /** Operation the caller is attempting. */
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
  /** Stamped onto start and list. The browser cannot choose another id. */
  respondentId: string;
};

/** Public fill caller. The response id is the capability. List is refused. */
export type AnonymousPrincipal = {
  /** Marks a public caller. List and a body `respondentId` are refused. */
  anonymous: true;
};

export type FillPrincipal = SurveyPrincipal | AnonymousPrincipal;

/** Input to {@link ValidateResult}. The snapshot is the response version. */
export type ValidateResultInput = {
  /** Document of the version the response started on. */
  definition: SurveyJson;
  /** Posted `survey.data`, or the stored object when submit omits `data`. */
  data: SurveyResult;
};

/**
 * Submit check against the response snapshot.
 * Return the cleaned `survey.data` to persist it.
 * Return nothing to keep `data`.
 * Throw `APIError` with `VALIDATION_FAILED` to reject.
 */
export type ValidateResult = (
  input: ValidateResultInput,
) => SurveyResult | void | Promise<SurveyResult | void>;

/**
 * Persistence for surveys, published versions, and response rows.
 *
 * `draftJson`, the current version, and `settings` stay independent.
 * `publishSurvey` inserts a version when the canonical document is new and
 * otherwise reuses the existing row. A response stores that version id at
 * start and never changes it. Honor `expectedUpdatedAt` inside the write.
 */
export type SurveyStore = {
  /** Create the survey or replace `draftJson`. Insert default settings once. */
  saveSurvey(input: SaveSurveyInput): Promise<SurveyRecord>;
  /**
   * Publish `draftJson` as the current version, set `active`, and update
   * `publishedAt`. An unchanged document reuses its version row.
   */
  publishSurvey(input: PublishSurveyInput): Promise<SurveyRecord>;
  /** Set `archived`. Keep the draft and every version. */
  archiveSurvey(input: ArchiveSurveyInput): Promise<SurveyRecord>;
  /** Replace `settings`. Do not change `draftJson` or any version. */
  saveSurveySettings(input: SaveSurveySettingsInput): Promise<SurveyRecord>;
  /**
   * Archived survey with a current version becomes `active` again.
   * Does not copy `draftJson`. An active survey is returned unchanged.
   */
  resumeSurvey(input: ResumeSurveyInput): Promise<SurveyRecord>;
  /** Survey by id, then by slug. `null` when missing. */
  getSurvey(idOrSlug: string): Promise<SurveyRecord | null>;
  /** Surveys matching {@link ListSurveysQuery}, `updatedAt` descending. */
  listSurveys(query?: ListSurveysQuery): Promise<SurveyRecord[]>;
  /**
   * Versions of one survey, `createdAt` descending.
   * An unknown survey id yields an empty page.
   */
  listSurveyVersions(query: ListSurveyVersionsQuery): Promise<SurveyVersion[]>;
  /** Versions with these ids, `createdAt` ascending. Missing ids are omitted. */
  readSurveyVersions(ids: readonly string[]): Promise<SurveyVersion[]>;
  /**
   * Insert a draft, or return the row selected by `settings.responses`.
   * Store the current version id. Anonymous starts always insert.
   */
  startResponse(
    input: StartResponseInput,
    lifecycle?: StartResponseLifecycle,
  ): Promise<ResponseRecord>;
  /**
   * Page of rows, `updatedAt` descending.
   * `"summary"` omits `data`. `"full"` includes `data` and omits `definition`.
   * Omitted `include` is `"summary"`.
   */
  listResponses(
    query?: ListResponsesQuery,
  ): Promise<(ResponseSummary | ResponseData)[]>;
  /** Matching row count. Ignores `limit`, `offset`, and `include`. */
  countResponses(query?: ListResponsesQuery): Promise<number>;
  /** Replace `data` on a draft. */
  savePartial(input: SavePartialInput): Promise<ResponseRecord>;
  /**
   * Store a submitted row. `prepare` supplies the data to persist.
   * An already submitted row goes through `alreadySubmitted` and skips hooks.
   */
  submitResponse(
    input: SubmitResponseInput,
    lifecycle?: SubmitResponseLifecycle,
  ): Promise<ResponseRecord>;
  /** Close a draft without changing `versionId` or `data`. */
  abandonResponse(input: ResponseMutationInput): Promise<ResponseRecord>;
  /**
   * Move a submitted or abandoned row back to `draft`.
   * Clears `submittedAt`. Does not change `versionId` or `data`.
   */
  reopenResponse(input: ResponseMutationInput): Promise<ResponseRecord>;
  /** Full response row, including the joined `definition`. `null` when missing. */
  getResponse(id: string): Promise<ResponseRecord | null>;
};
