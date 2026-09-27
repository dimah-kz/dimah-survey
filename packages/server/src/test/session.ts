import {
  createEditorClient,
  createFillClient,
  type EditorClient,
  type FillClient,
  type SurveyJson,
  type ValidateResult,
} from "@dimah-survey/core";

import {
  dimahSurvey,
  type EditorHooks,
  type FillHooks,
  type SanitizePartial,
} from "../dimah-survey";
import { memoryAdapter } from "../memory";
import { guardAnonymous, guardRespondent } from "../respondent";

export const textSurvey = {
  title: "v1",
  pages: [{ name: "p", elements: [{ type: "text", name: "q1" }] }],
} satisfies SurveyJson;

const origin = "http://survey.local";
const editorBase = "/api/editor";
const fillBase = "/api/fill";

export function createSession(options?: {
  database?: ReturnType<typeof memoryAdapter>;
  respondentId?: string;
  fillHooks?: FillHooks;
  editorHooks?: EditorHooks;
  sanitizePartial?: SanitizePartial;
  validateResult?: ValidateResult;
}) {
  const database = options?.database ?? memoryAdapter();
  const editorSurvey = dimahSurvey({
    audience: "editor",
    database,
    basePath: editorBase,
    hooks: options?.editorHooks,
  });
  const fillSurvey = dimahSurvey({
    audience: "fill",
    database,
    basePath: fillBase,
    hooks: options?.fillHooks,
    sanitizePartial: options?.sanitizePartial,
    ...(options?.validateResult
      ? { validateResult: options.validateResult }
      : {}),
    guard: (context) =>
      options?.respondentId
        ? guardRespondent(options.respondentId)(context)
        : guardAnonymous()(context),
  });
  const fetchFor =
    (survey: { handler: (request: Request) => Promise<Response> }) =>
    (input: RequestInfo | URL, init?: RequestInit) =>
      survey.handler(new Request(input, init));

  const editor: EditorClient = createEditorClient({
    baseURL: `${origin}${editorBase}`,
    fetch: fetchFor(editorSurvey),
  });
  const fill: FillClient = createFillClient({
    baseURL: `${origin}${fillBase}`,
    fetch: fetchFor(fillSurvey),
  });

  return {
    database,
    editor,
    fill,
    fillHandler: fillSurvey.handler,
    respondent(respondentId: string) {
      const other = dimahSurvey({
        audience: "fill",
        database,
        basePath: fillBase,
        sanitizePartial: options?.sanitizePartial,
        ...(options?.validateResult
          ? { validateResult: options.validateResult }
          : {}),
        guard: (context) => guardRespondent(respondentId)(context),
      });
      return createFillClient({
        baseURL: `${origin}${fillBase}`,
        fetch: fetchFor(other),
      });
    },
  };
}

export async function publishSurvey(
  editor: EditorClient,
  input?: { id?: string; draftJson?: SurveyJson },
) {
  const id = input?.id ?? "pulse";
  await editor.saveSurvey({
    id,
    draftJson: input?.draftJson ?? textSurvey,
  });
  return editor.publishSurvey({ id });
}

export function fillUrl(path: string) {
  return `${origin}${fillBase}${path}`;
}
