import { createRequire } from "node:module";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next sets react.version to "detect", which calls the
// context.getFilename() API ESLint 10 removed. An explicit version skips that.
const { version: reactVersion } = createRequire(import.meta.url)(
  "react/package.json",
);

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      react: {
        version: reactVersion,
      },
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
