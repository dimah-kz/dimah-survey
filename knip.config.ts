import type { KnipConfig } from "knip";

const config: KnipConfig = {
  // The Next example is an app graph (routes, CSS, Drizzle), not a library package.
  ignore: ["examples/**"],
  ignoreIssues: {
    "packages/**": ["exports", "types", "duplicates", "nsExports", "nsTypes"],
    // Published copy-paste schemas — not imported at runtime.
    "packages/db/src/schema/examples/**": ["files"],
  },
};

export default config;
