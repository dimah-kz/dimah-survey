import { surveyStoreContract } from "@workspace/survey-store-contract";

import { memoryAdapter } from "./memory";

surveyStoreContract("memory", () => memoryAdapter());
