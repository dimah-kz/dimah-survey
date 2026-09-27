import { type InferPageType, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";

import {
  absolutizeMarkdownUrls,
  LLM_PAGE_PRIORITY,
  toMarkdownTwinUrls,
} from "@/lib/llm-intro";
import { docsRoute } from "@/lib/shared";
import { getSiteUrl } from "@/lib/site-url";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/** Markdown twin of a docs page (`/docs/page.md`), per llmstxt.org. */
export function getPageMarkdownUrl(page: { url: string }) {
  return { url: `${page.url}.md` };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText("processed");
  const origin = getSiteUrl().origin;
  const absolute = absolutizeMarkdownUrls(processed, origin);
  const linked = toMarkdownTwinUrls(absolute, origin);

  return `# ${page.data.title} (${origin}${page.url})

${linked}`;
}

export function orderPagesForLlms<T extends { url: string }>(pages: T[]): T[] {
  const rank = new Map<string, number>(
    LLM_PAGE_PRIORITY.map((url, index) => [url, index]),
  );

  return [...pages].sort((a, b) => {
    const aRank = rank.get(a.url) ?? Number.MAX_SAFE_INTEGER;
    const bRank = rank.get(b.url) ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return a.url.localeCompare(b.url);
  });
}
