/** Build artifacts, caches, and generated files — shared by all ESLint configs. */
export const ignorePatterns = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.turbo/**",
  "**/coverage/**",
  "**/.vitest/**",
  "**/.eslintcache",
  "**/.prettiercache",
  "**/tsup.config.bundled_*.mjs",
];
