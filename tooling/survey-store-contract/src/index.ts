import { describe } from "vitest";

import { collectionContract } from "./collection";
import type { OpenSurveyStore } from "./helpers";
import { responseContract } from "./responses";
import { surveyDocumentContract } from "./surveys";

/** Behavior both `memoryAdapter()` and `db()` must keep. */
export function surveyStoreContract(name: string, open: OpenSurveyStore) {
  describe(name, () => {
    surveyDocumentContract(open);
    responseContract(open);
    collectionContract(open);
  });
}

export type { OpenSurveyStore };
