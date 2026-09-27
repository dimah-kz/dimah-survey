import { createGetUrl } from "fumadocs-core/source";

export const appName = "dimah-survey";
/** Landing H1, browser tab, and Open Graph title — keep these in sync. */
export const siteHeadline = "The backend lifecycle layer";
export const siteHeadlineAccent = "for SurveyJS.";
const siteTagline = `${siteHeadline} ${siteHeadlineAccent}`;
export const siteTitle = `${appName} — ${siteTagline}`;
export const siteDescription =
  "A backend lifecycle layer for SurveyJS. Publish survey JSON, freeze each response definition, and validate submissions on your server.";

/** Site-wide terms for the homepage, layout, and JSON-LD. */
export const siteKeywords = [
  "dimah-survey",
  "dimah survey",
  "surveyjs",
  "survey.js",
  "survey backend",
  "survey lifecycle",
  "response snapshot",
  "headless survey",
  "typescript",
  "react",
  "next.js",
] as const;

/** Brand terms for per-page docs meta. */
export const pageBrandKeywords = [
  "dimah-survey",
  "dimah survey",
  "surveyjs",
] as const;

export function docsPageKeywords(title: string): string[] {
  const extra = title.toLowerCase().trim();
  const keywords: string[] = [...pageBrandKeywords];
  if (extra && !keywords.includes(extra)) {
    keywords.push(extra);
  }
  return keywords;
}

export const docsRoute = "/docs";
export const docsImageRoute = "/og/docs";
export const docsContentRoute = "/llms.mdx/docs";

export const gitConfig = {
  user: "dimah-kz",
  repo: "dimah-survey",
  branch: "main",
} as const;

export const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;
export const xProfileUrl = "https://x.com/dimahkzx";

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

export function docsArticleJsonLd(input: {
  origin: string;
  url: string;
  title: string;
  description: string;
}) {
  const pageUrl = `${input.origin}${input.url}`;

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: input.title,
    description: input.description,
    url: pageUrl,
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: appName,
      url: input.origin,
    },
    author: {
      "@type": "Organization",
      name: appName,
      url: input.origin,
    },
  };
}

export function siteJsonLd(origin: string) {
  const orgId = `${origin}/#organization`;
  const sameAs = [githubUrl, xProfileUrl];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: appName,
        url: origin,
        logo: `${origin}/apple-icon`,
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: appName,
        url: origin,
        description: siteDescription,
        inLanguage: "en",
        keywords: siteKeywords.join(", "),
        publisher: { "@id": orgId },
      },
      {
        "@type": "SoftwareApplication",
        name: appName,
        description: siteDescription,
        url: origin,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "Surveys / Developer Tools",
        operatingSystem: "Web",
        license: "https://opensource.org/licenses/MIT",
        isAccessibleForFree: true,
        keywords: siteKeywords.join(", "),
        publisher: { "@id": orgId },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          "Backend lifecycle for SurveyJS JSON",
          "Editable draft and explicit publish",
          "Frozen response definitions",
          "Submit validation against the stored definition",
          "Separate fill and editor audiences",
          "SurveyJS renderer stays in the application",
          "Next.js, Hono, Express, Fastify, Elysia, SvelteKit, and Node adapters",
          "SQL store or an in-memory adapter",
        ],
      },
      {
        "@type": "SoftwareSourceCode",
        name: appName,
        description: siteDescription,
        url: origin,
        codeRepository: githubUrl,
        programmingLanguage: "TypeScript",
        runtimePlatform: "Node.js",
        license: "https://opensource.org/licenses/MIT",
        isAccessibleForFree: true,
        publisher: { "@id": orgId },
        sameAs,
      },
    ],
  };
}

/** MDX collection, relative to the repository root. */
const docsContentDir = "apps/docs/content/docs";

export function pageGithubUrl(page: { path: string }) {
  return `${githubUrl}/blob/${gitConfig.branch}/${docsContentDir}/${page.path}`;
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, "image.png"];

  return { segments, url: getImageUrl(segments, page.locale) };
}
