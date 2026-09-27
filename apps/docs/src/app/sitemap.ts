import type { MetadataRoute } from "next";

import { absoluteUrl, siteUrl } from "@/lib/shared";
import { source } from "@/lib/source";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl },
    ...source.getPages().map((page) => ({
      url: absoluteUrl(page.url),
    })),
  ];
}
