import { surveyStoreContract } from "@workspace/survey-store-contract";

import { openSqliteStore } from "./test/sqlite";

surveyStoreContract("sqlite", openSqliteStore);
