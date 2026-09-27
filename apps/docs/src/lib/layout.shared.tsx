import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { appName, githubUrl } from "@/lib/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
    },
    githubUrl,
  };
}
