import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function PreReleaseBanner() {
  return (
    <div className="border-b border-fd-primary/15 bg-fd-primary/[0.035]">
      <div className="mx-auto flex min-h-10 max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center text-xs text-fd-muted-foreground sm:px-6">
        <span className="rounded-full bg-fd-primary px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em] text-fd-primary-foreground uppercase">
          Pre-release
        </span>
        <span>
          The API is available in this repository; packages are not on npm yet.
        </span>
        <Link
          href="/docs/example"
          className="inline-flex shrink-0 items-center gap-0.5 font-medium text-fd-foreground underline decoration-fd-primary/35 underline-offset-4 transition-colors hover:text-fd-primary"
        >
          Run the example
          <ArrowUpRight className="size-3" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
