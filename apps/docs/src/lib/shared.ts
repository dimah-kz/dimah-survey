import { createGetUrl } from "fumadocs-core/source";

export const appName = "dimah-survey";
export const siteDescription =
  "A backend lifecycle layer for SurveyJS. Publish survey JSON, freeze each response definition, and validate submissions on your server.";
/** Public documentation origin. Preview and local builds keep this as the canonical site. */
export const siteUrl = "https://survey.dimah.dev";
export const docsRoute = "/docs";
export const docsImageRoute = "/og/docs";
export const docsContentRoute = "/llms.mdx/docs";

export const gitConfig = {
  user: "dimah-kz",
  repo: "dimah-survey",
  branch: "main",
} as const;

export const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

export function absoluteUrl(path: string) {
  if (path === "/" || path === "") return siteUrl;
  return new URL(path, siteUrl).href;
}

/** Point root-relative Markdown links at the public docs origin. */
export function withSiteOrigin(markdown: string) {
  return markdown.replaceAll("](/", `](${siteUrl}/`);
}

/** MDX collection, relative to the repository root. */
const docsContentDir = "apps/docs/content/docs";

export function pageGithubUrl(page: { path: string }) {
  return `${githubUrl}/blob/${gitConfig.branch}/${docsContentDir}/${page.path}`;
}

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, "content.md"];

  return { segments, url: getContentUrl(segments, page.locale) };
}

const getImageUrl = createGetUrl(docsImageRoute);

export function getPageImageUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, "image.png"];

  return { segments, url: getImageUrl(segments, page.locale) };
}
