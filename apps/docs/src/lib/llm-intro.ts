/**
 * Shared copy and helpers for `/llms.txt` and `/llms-full.txt`.
 *
 * Those routes are for coding agents, not the docs UI. Structure follows
 * https://llmstxt.org: H1, blockquote, preamble, then H2 file lists.
 */
import { docsRoute, gitConfig, githubUrl, xProfileUrl } from "./shared";
import { getSiteUrl } from "./site-url";

/** Pages that should appear first in the agent index (then the rest by URL). */
export const LLM_PAGE_PRIORITY = [
  "/docs",
  "/docs/quickstart",
  "/docs/comparison",
  "/docs/surveys",
  "/docs/settings",
  "/docs/responses",
  "/docs/database",
  "/docs/integration",
  "/docs/security",
  "/docs/react",
  "/docs/creator",
  "/docs/packages",
  "/docs/configuration",
  "/docs/protocol",
  "/docs/errors",
] as const;

export const llmMarkdownHeaders = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
} as const;

export function absolutizeMarkdownUrls(markdown: string, origin: string) {
  return markdown.replaceAll("](/", `](${origin}/`);
}

/**
 * Point docs links at markdown twins (`/docs/page.md`), per llmstxt.org.
 * HTML `/docs` URLs still work for humans; agents should fetch `.md`.
 */
export function toMarkdownTwinUrls(markdown: string, origin: string) {
  return markdown.replaceAll(/\[[^\]]+\]\([^)]+\)/g, (full) => {
    const splitAt = full.indexOf("](");
    const title = full.slice(1, splitAt);
    const url = full.slice(splitAt + 2, -1);
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return full;
    }
    if (parsed.origin !== origin) return full;
    if (
      parsed.pathname !== docsRoute &&
      !parsed.pathname.startsWith(`${docsRoute}/`)
    ) {
      return full;
    }
    if (/\.(?:md|mdx|txt)$/i.test(parsed.pathname)) return full;
    parsed.pathname = `${parsed.pathname}.md`;
    return `[${title}](${parsed.toString()})`;
  });
}

export function llmDecisionSheet(): string {
  return `# dimah-survey

> Backend for SurveyJS surveys. Store the draft, publish it, collect responses, and validate each submission in your application.

SurveyJS owns the form schema, Creator, and renderer. Your application owns authentication, migrations, files, and UI. dimah-survey is the HTTP API and the store: publish, drafts, collection policy, and submit checks. The integration shape matches Better Auth: create an instance, pass your database, and mount the handler.

TypeScript packages: \`@dimah-survey/core\` (protocol, browser clients, schemas, errors, store types), \`@dimah-survey/server\` (\`dimahSurvey()\`, guards, validation, adapters), \`@dimah-survey/react\` (SurveyJS Model and Creator bindings), \`@dimah-survey/db\` (SQL store). HTTP adapters: Next.js App Router, Express, Hono, Fastify, Elysia, SvelteKit, and Node.

Use it when a SurveyJS app needs its own backend for publish and responses. Skip it for a visual form builder, a hosted survey product, a SurveyJS renderer, or a dimah-form integration.

Install: \`npm i @dimah-survey/server @dimah-survey/db @dimah-survey/react survey-core survey-react-ui\`. Adding the SQL tables, including \`fumadb\`, is \`/docs/database\`. \`memoryAdapter()\` from \`@dimah-survey/server\` is a process-local store for tests. Published and still before \`1.0.0\`. A release may change the API.

- Auth stays in the consumer \`guard\`. Do not look for library auth.
- Fill and editor are separate HTTP handlers on one shared store. Editor routes are not mounted on fill.
- \`draftJson\` is the editor copy. Publishing stores that document. An unchanged document reuses it. A later publish does not change a response's \`versionId\`.
- Submit validation uses the survey the response started with, not the live draft or the latest publish.
- Partial save replaces \`survey.data\`. It is not a key patch.
- Do not wrap the SurveyJS renderer, translate SurveyJS JSON into another field model, or import \`@dimah-form/*\`.
`;
}

function packageTree(name: string) {
  return `${githubUrl}/tree/${gitConfig.branch}/packages/${name}`;
}

export function llmFileLists(origin = getSiteUrl().origin): string {
  return `## Packages

- [@dimah-survey/core](${packageTree("core")}): protocol, clients, schemas, errors, and store types
- [@dimah-survey/server](${packageTree("server")}): \`dimahSurvey()\`, guards, validation, and adapters
- [@dimah-survey/react](${packageTree("react")}): SurveyJS Model and Creator bindings
- [@dimah-survey/db](${packageTree("db")}): SQL \`SurveyStore\`

## Optional

- [Full docs dump](${origin}/llms-full.txt): every page as markdown
- [GitHub](${githubUrl}): source repository
- [X](${xProfileUrl}): updates
`;
}
