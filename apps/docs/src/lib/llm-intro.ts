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
  "/docs/integration",
  "/docs/persistence",
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

> Server-owned publishing and response lifecycles for SurveyJS JSON. Publish a document, freeze the definition each response starts with, and validate submit against that same snapshot.

SurveyJS owns the schema, Creator, question behavior, and renderer. Your application owns authentication, database migrations, files, and UI. dimah-survey owns publish, response snapshots, drafts, collection policy, and submit validation.

TypeScript packages: \`@dimah-survey/core\` (protocol, browser clients, schemas, errors, store types), \`@dimah-survey/server\` (\`dimahSurvey()\`, guards, validation, adapters, \`memoryAdapter()\`), \`@dimah-survey/react\` (SurveyJS Model and Creator bindings), \`@dimah-survey/db\` (SQL store). HTTP adapters: Next.js App Router, Express, Hono, Fastify, Elysia, SvelteKit, and Node.

Use it when a SurveyJS app needs explicit publish and reproducible response history. Skip it for a visual form builder, hosted survey product, SurveyJS renderer, or dimah-form integration.

Install: \`npm i @dimah-survey/server @dimah-survey/react survey-core survey-react-ui\`. Add \`@dimah-survey/db\` for the SQL store.

- Auth stays in the consumer \`guard\`. Do not look for library auth.
- \`draftJson\` is the editor copy. \`publishedJson\` is what new responses clone. A later publish does not change \`response.definition\`.
- Submit validation runs on the stored response definition, not the live draft or the latest publish.
- Partial save replaces \`survey.data\`. It is not a key patch.
- Fill and editor are separate HTTP audiences over one shared store.
- Do not wrap the SurveyJS renderer, translate SurveyJS JSON into another field model, or import \`@dimah-form/*\`.
`;
}

function packageTree(name: string) {
  return `${githubUrl}/tree/${gitConfig.branch}/packages/${name}`;
}

export function llmFileLists(origin = getSiteUrl().origin): string {
  return `## Packages

- [@dimah-survey/core](${packageTree("core")}): protocol, clients, schemas, errors, and store types
- [@dimah-survey/server](${packageTree("server")}): \`dimahSurvey()\`, guards, validation, adapters, and \`memoryAdapter()\`
- [@dimah-survey/react](${packageTree("react")}): SurveyJS Model and Creator bindings
- [@dimah-survey/db](${packageTree("db")}): SQL \`SurveyStore\`

## Optional

- [Full docs dump](${origin}/llms-full.txt): every page as markdown
- [GitHub](${githubUrl}): source repository
- [X](${xProfileUrl}): updates
`;
}
