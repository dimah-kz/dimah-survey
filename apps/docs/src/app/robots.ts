import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/shared";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/og/", "/llms.mdx/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
