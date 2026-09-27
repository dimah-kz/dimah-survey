import {
  DEFAULT_SURVEY_SETTINGS,
  type SurveyJson,
  type SurveySettings,
  type SurveyStore,
} from "@dimah-survey/core";

export type OpenSurveyStore = () => SurveyStore | Promise<SurveyStore>;

export const v1: SurveyJson = { title: "v1", pages: [] };
export const v2: SurveyJson = { title: "v2", pages: [] };

export function settings(patch: Partial<SurveySettings> = {}): SurveySettings {
  return { ...DEFAULT_SURVEY_SETTINGS, ...patch };
}

/**
 * SQL columns often keep `updatedAt` to the second. Wait long enough that
 * two writes cannot share a timestamp.
 */
export function later() {
  return new Promise((resolve) => {
    setTimeout(resolve, 1100);
  });
}

export async function publish(
  store: SurveyStore,
  input?: {
    id?: string;
    slug?: string;
    draftJson?: SurveyJson;
    settings?: SurveySettings;
  },
) {
  const id = input?.id ?? "pulse";
  const created = await store.saveSurvey({
    id,
    slug: input?.slug ?? id,
    draftJson: input?.draftJson ?? v1,
  });
  const ready = input?.settings
    ? await store.saveSurveySettings({
        id,
        settings: input.settings,
        expectedUpdatedAt: created.updatedAt,
      })
    : created;
  return store.publishSurvey({
    id,
    expectedUpdatedAt: ready.updatedAt,
  });
}
