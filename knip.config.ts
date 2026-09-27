import type { KnipConfig } from "knip";

const config: KnipConfig = {
  // Next apps are route graphs, not library packages.
  ignore: ["examples/**", "apps/**"],
  ignoreIssues: {
    "packages/**": ["exports", "types", "duplicates", "nsExports", "nsTypes"],
    // Published copy-paste schemas — not imported at runtime.
    "packages/db/src/schema/examples/**": ["files"],
  },
};

export default config;
