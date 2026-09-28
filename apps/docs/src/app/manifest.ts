import type { MetadataRoute } from "next";

import { brandColor, brandLogoSize } from "@/lib/brand";
import { appName, siteDescription } from "@/lib/shared";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appName,
    short_name: appName,
    description: siteDescription,
    lang: "en",
    start_url: "/",
    scope: "/",
    display: "browser",
    background_color: "#f5f5f5",
    theme_color: brandColor,
    icons: [
      {
        src: "/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icon/${brandLogoSize}`,
        sizes: `${brandLogoSize}x${brandLogoSize}`,
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
