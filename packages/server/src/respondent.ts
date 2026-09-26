import type {
  GuardContext,
  ListResponsesQuery,
  Operation,
  StartResponseInput,
  SurveyPrincipal,
  SurveyStore,
} from "@dimah-survey/core";

import { errors } from "@/errors";

const FILL_OPERATIONS = new Set<Operation>([
  "startResponse",
  "listResponses",
  "getResponse",
  "savePartial",
  "submitResponse",
  "abandonResponse",
  "reopenResponse",
]);

type RespondentCall = {
  body?: unknown;
  query?: unknown;
};

/**
 * Guard result for a fill request. Editor operations throw, and the server
 * stamps `respondentId` onto start and list.
 */
export function guardRespondent(respondentId: string) {
  return (context: GuardContext): SurveyPrincipal => {
    if (respondentId.length === 0 || !FILL_OPERATIONS.has(context.operation)) {
      throw errors.forbidden();
    }
    return { respondentId };
  };
}

export async function enforceRespondent(
  operation: Operation,
  principal: SurveyPrincipal,
  input: RespondentCall,
  database: SurveyStore,
): Promise<void> {
  if (principal.respondentId.length === 0 || !FILL_OPERATIONS.has(operation)) {
    throw errors.forbidden();
  }
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
