import Link from "next/link";

import { BrandTitle } from "@/components/brand";
import { githubUrl } from "@/lib/shared";

export function SiteFooter() {
  return (
    <footer className="border-t border-fd-border bg-fd-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2">
          <BrandTitle />
          <p className="text-sm text-fd-muted-foreground">
            Response lifecycle infrastructure for SurveyJS JSON.
          </p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fd-muted-foreground"
        >
          <Link
            href="/docs"
            className="transition-colors hover:text-fd-foreground"
          >
            Documentation
          </Link>
          <Link
            href="/docs/example"
            className="transition-colors hover:text-fd-foreground"
          >
            Example
          </Link>
          <Link
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-fd-foreground"
          >
            GitHub
          </Link>
        </nav>
      </div>
    </footer>
  );
}
