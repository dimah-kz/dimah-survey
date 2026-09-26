import {
  FILL_AUDIENCE_OPERATIONS,
  type AnonymousPrincipal,
  type FillPrincipal,
  type GuardContext,
  type ListResponsesQuery,
  type Operation,
  type StartResponseInput,
  type SurveyPrincipal,
  type SurveyStore,
} from "@dimah-survey/core";

import { errors } from "@/errors";

const FILL_OPERATIONS = new Set<Operation>(FILL_AUDIENCE_OPERATIONS);

type RespondentCall = {
  body?: unknown;
  query?: unknown;
};

function isAnonymousPrincipal(
  principal: FillPrincipal,
): principal is AnonymousPrincipal {
  return (
    "anonymous" in principal &&
    principal.anonymous &&
    !("respondentId" in principal)
  );
}

function isRespondentPrincipal(
  principal: FillPrincipal,
): principal is SurveyPrincipal {
  return (
    "respondentId" in principal &&
    typeof principal.respondentId === "string" &&
    principal.respondentId.length > 0 &&
    !("anonymous" in principal)
  );
}

/**
 * Guard result for a logged-in fill request.
 * Pair with `enforceFillPrincipal`, which stamps this id onto the call.
 */
export function guardRespondent(respondentId: string) {
  return (context: GuardContext): SurveyPrincipal => {
    if (respondentId.length === 0 || !FILL_OPERATIONS.has(context.operation)) {
      throw errors.forbidden();
    }
    return { respondentId };
  };
}

/** Guard result for a public fill request. The response id is the capability. */
export function guardAnonymous() {
  return (context: GuardContext): AnonymousPrincipal => {
    if (!FILL_OPERATIONS.has(context.operation)) throw errors.forbidden();
    return { anonymous: true };
  };
}

export async function enforceFillPrincipal(
  operation: Operation,
  principal: FillPrincipal,
  input: RespondentCall,
  database: SurveyStore,
): Promise<void> {
  if (isAnonymousPrincipal(principal)) {
    await enforceAnonymous(operation, input, database);
    return;
  }
  if (!isRespondentPrincipal(principal)) throw errors.forbidden();
  await enforceRespondent(operation, principal, input, database);
}

async function enforceAnonymous(
  operation: Operation,
  input: RespondentCall,
  database: SurveyStore,
) {
  if (!FILL_OPERATIONS.has(operation) || operation === "listResponses") {
    throw errors.forbidden();
  }
  if (operation === "getPublishedSurvey") return;
  if (operation === "startResponse") {
    const body = input.body as StartResponseInput;
    if (body.respondentId) throw errors.forbidden();
    return;
  }
  const id = responseId(operation, input);
  if (!id) throw errors.forbidden();
  const row = await database.getResponse(id);
  if (!row || row.respondentId !== null) throw errors.forbidden();
}

async function enforceRespondent(
  operation: Operation,
  principal: SurveyPrincipal,
  input: RespondentCall,
  database: SurveyStore,
): Promise<void> {
  if (principal.respondentId.length === 0 || !FILL_OPERATIONS.has(operation)) {
    throw errors.forbidden();
  }
  if (operation === "getPublishedSurvey") return;
  if (operation === "startResponse") {
    const body = input.body as StartResponseInput;
    claimRespondent(body.respondentId, principal.respondentId);
    body.respondentId = principal.respondentId;
    return;
  }
  if (operation === "listResponses") {
    const query = ensureListQuery(input);
    if (query.include === "full") throw errors.forbidden();
    claimRespondent(query.respondentId, principal.respondentId);
    query.respondentId = principal.respondentId;
    return;
  }
  const id = responseId(operation, input);
  if (!id) throw errors.forbidden();
  const row = await database.getResponse(id);
  if (!row || row.respondentId !== principal.respondentId) {
    throw errors.forbidden();
  }
}

function claimRespondent(claimed: string | undefined, respondentId: string) {
  if (claimed !== undefined && claimed !== respondentId) {
    throw errors.forbidden();
  }
}

function ensureListQuery(input: RespondentCall): ListResponsesQuery {
  if (input.query && typeof input.query === "object") {
    return input.query as ListResponsesQuery;
  }
  const query: ListResponsesQuery = {};
  input.query = query;
  return query;
}

function responseId(operation: Operation, input: RespondentCall) {
  const source = operation === "getResponse" ? input.query : input.body;
  if (!source || typeof source !== "object" || !("id" in source)) return;
  const id = source.id;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}
