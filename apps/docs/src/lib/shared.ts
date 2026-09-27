import { createGetUrl } from "fumadocs-core/source";

export const appName = "dimah-survey";
export const docsRoute = "/docs";
export const docsImageRoute = "/og/docs";
export const docsContentRoute = "/llms.mdx/docs";

export const gitConfig = {
  user: "dimah-kz",
  repo: "dimah-survey",
  branch: "main",
} as const;

export const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

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
