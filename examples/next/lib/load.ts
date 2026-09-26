import "server-only";

import { isAPIError, SURVEY_ERROR_CODES } from "@dimah-survey/core";
import { notFound } from "next/navigation";

import { fillHeaders } from "@/lib/cookie";
import { isMissing } from "@/lib/errors";
import { editor, fill } from "@/lib/survey";

export async function listPublished() {
  const page = await editor.api.listSurveys({
    query: { status: "active", limit: 100 },
  });
  return page.surveys;
}

export async function listAllSurveys() {
  const page = await editor.api.listSurveys({ query: { limit: 100 } });
  return page.surveys;
}

export async function readSurvey(id: string) {
  try {
    return await editor.api.getSurvey({ query: { id } });
  } catch (error) {
    if (isMissing(error)) notFound();
    throw error;
  }
}

export async function listSurveyResponses(surveyId: string) {
  return editor.api.listResponses({
    query: { surveyId, limit: 100 },
  });
}

export async function readResponse(id: string) {
  try {
    return await editor.api.getResponse({ query: { id } });
  } catch (error) {
    if (isMissing(error)) notFound();
    throw error;
  }
}

export async function readOwnResponse(id: string) {
  try {
    return await fill.api.getResponse({
      headers: await fillHeaders(),
      query: { id },
    });
  } catch (error) {
    if (isMissing(error)) notFound();
    throw error;
  }
}

export async function listOwnDrafts() {
  try {
    const page = await fill.api.listResponses({
      headers: await fillHeaders(),
      query: { status: "draft", limit: 100 },
    });
    return page.responses;
  } catch (error) {
    if (isAPIError(error) && error.code === SURVEY_ERROR_CODES.FORBIDDEN.code) {
      return [];
    }
    throw error;
  }
}
