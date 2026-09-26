import "server-only";

import { DimahSurveyDB, db } from "@dimah-survey/db";
import {
  SURVEY_API_BASE_PATH,
  SURVEY_EDITOR_API_BASE_PATH,
  dimahSurvey,
  guardAnonymous,
  guardRespondent,
} from "@dimah-survey/server";
import { drizzleAdapter } from "fumadb/adapters/drizzle";

import { sqlite } from "@/db";
import { respondentIdFromRequest } from "@/lib/respondent";
import { welcomeSurvey } from "@/lib/sample";

const database = db(
  DimahSurveyDB.client(drizzleAdapter({ db: sqlite, provider: "sqlite" })),
);

export const fill = dimahSurvey({
  audience: "fill",
  database,
  basePath: SURVEY_API_BASE_PATH,
  guard: (context) => {
    const respondentId = respondentIdFromRequest(context.request);
    if (!respondentId) return guardAnonymous()(context);
    return guardRespondent(respondentId)(context);
  },
});

// Open on purpose: a real app throws unless the session is an editor.
export const editor = dimahSurvey({
  audience: "editor",
  database,
  basePath: SURVEY_EDITOR_API_BASE_PATH,
});

const WELCOME_ID = "welcome";

export async function seed() {
  if (await database.getSurvey(WELCOME_ID)) return;
  await database.saveSurvey({
    id: WELCOME_ID,
    slug: "welcome",
    draftJson: welcomeSurvey,
  });
  await database.publishSurvey({ id: WELCOME_ID });
}
