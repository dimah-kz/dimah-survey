<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Example

Next.js consumer of `@dimah-survey/*`. SurveyJS renders the survey and Creator. This app mounts the fill and editor handlers, a browser respondent cookie, and a SQLite store (`db()` from `@dimah-survey/db` on Drizzle).

Formatting and the `check-types` script follow the repository. Next and `eslint-config-next` come from the default workspace catalog, including `eslint`. `eslint.config.js` sets `settings.react.version` from the installed `react` package: `eslint-config-next` uses `"detect"`, and that path calls `context.getFilename()`, which ESLint 10 removed. `typescript` is `catalog:typescript6` so that plugin's TypeScript parser can import a compiler API. `@typescript/native` is the TypeScript 7 `tsc`. Do not add a local Prettier config. shadcn aliases in `components.json` match the `@/*` paths in `tsconfig.json`.

Do not import `@dimah-form/*`. Do not render `<Survey>` or Creator inside the library packages.
