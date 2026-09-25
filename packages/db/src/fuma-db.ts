import { fumadb } from "fumadb";

import { v1 } from "./schema/v1";

export const DimahSurveyDB = fumadb({
  namespace: "dimah_survey",
  schemas: [v1],
});

export { v1 };
