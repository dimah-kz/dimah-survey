import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  LockKeyhole,
} from "lucide-react";

import {
  githubUrl,
  siteDescription,
  siteHeadline,
  siteHeadlineAccent,
} from "@/lib/shared";

function GitHubIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const documentationLinks = [
  {
    index: "01",
    title: "Overview",
    description: "Understand the lifecycle",
    href: "/docs",
  },
  {
    index: "02",
    title: "Quickstart",
    description: "Build the first response",
    href: "/docs/quickstart",
  },
  {
    index: "03",
    title: "Integration",
    description: "Mount your runtime",
    href: "/docs/integration",
  },
  {
    index: "04",
    title: "Protocol",
    description: "Read the API contract",
    href: "/docs/protocol",
  },
] as const;

export default function HomePage() {
  return (
    <main id="main" className="relative isolate overflow-hidden">
      <div className="landing-ambient pointer-events-none absolute inset-x-0 top-0 -z-20 h-[52rem]" />
      <div className="landing-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[46rem] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-70" />

      <section
        aria-labelledby="hero-heading"
        className="mx-auto grid min-h-[calc(100svh-8rem)] w-full max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(25rem,0.78fr)] lg:gap-20 lg:py-24"
      >
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2.5 font-mono text-[0.7rem] font-medium tracking-[0.12em] text-fd-muted-foreground uppercase">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-fd-primary opacity-30" />
              <span className="relative inline-flex size-2 rounded-full bg-fd-primary" />
            </span>
            Open source · TypeScript · SurveyJS-native
          </div>

          <h1
            id="hero-heading"
            className="mt-7 max-w-3xl text-5xl leading-[0.98] font-semibold tracking-[-0.055em] text-balance text-fd-foreground sm:text-6xl lg:text-[4.4rem]"
          >
            <span className="block">{siteHeadline}</span>
            <span className="block text-fd-primary">{siteHeadlineAccent}</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-pretty text-fd-muted-foreground sm:text-lg sm:leading-8">
            {siteDescription}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/quickstart"
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground shadow-[0_1px_0_color-mix(in_oklab,var(--color-fd-foreground)_12%,transparent)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-fd-primary/90"
            >
              Read the quickstart
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex h-11 items-center gap-2 rounded-lg border border-fd-border bg-fd-background/75 px-5 text-sm font-medium text-fd-foreground backdrop-blur-sm transition-[background-color,border-color] hover:border-fd-primary/30 hover:bg-fd-muted"
            >
              <GitHubIcon />
              View on GitHub
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="mt-8 inline-flex max-w-full items-center gap-3 rounded-lg border border-fd-border/80 bg-fd-background/55 px-3.5 py-2 font-mono text-xs text-fd-muted-foreground backdrop-blur-sm">
            <span aria-hidden className="text-fd-primary">
              $
            </span>
            <code className="truncate">
              npm i @dimah-survey/server @dimah-survey/react
            </code>
          </div>
        </div>

        <LifecycleContract />
      </section>

      <nav
        aria-label="Documentation"
        className="mx-auto w-full max-w-7xl border-y border-fd-border/80 px-5 sm:px-8"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {documentationLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-28 items-center gap-4 border-b border-fd-border/80 py-6 transition-colors hover:text-fd-primary sm:odd:border-r sm:nth-last-[-n+2]:border-b-0 lg:border-r lg:border-b-0 lg:last:border-r-0 lg:odd:border-r"
            >
              <span className="font-mono text-[0.65rem] text-fd-muted-foreground">
                {item.index}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-fd-foreground transition-colors group-hover:text-fd-primary">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs text-fd-muted-foreground">
                  {item.description}
                </span>
              </span>
              <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-fd-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-fd-primary" />
            </Link>
          ))}
        </div>
      </nav>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-fd-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>Open source under the MIT License.</p>
        <Link
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 transition-colors hover:text-fd-foreground"
        >
          <GitHubIcon />
          dimah-kz/dimah-survey
        </Link>
      </footer>
    </main>
  );
}

function LifecycleContract() {
  return (
    <aside
      aria-label="Response lifecycle contract"
      className="relative mx-auto w-full max-w-lg lg:mx-0"
    >
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-fd-primary/6 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-fd-border/90 bg-fd-card/80 shadow-[0_24px_80px_-36px_color-mix(in_oklab,var(--color-fd-foreground)_28%,transparent)] backdrop-blur-xl">
        <div className="flex h-12 items-center justify-between border-b border-fd-border/80 px-4">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2 rounded-full bg-fd-muted-foreground/25" />
            <span className="size-2 rounded-full bg-fd-muted-foreground/25" />
            <span className="size-2 rounded-full bg-fd-primary/50" />
          </div>
          <code className="font-mono text-[0.65rem] text-fd-muted-foreground">
            response.lifecycle
          </code>
        </div>

        <div className="p-5 sm:p-7">
          <p className="font-mono text-[0.65rem] font-medium tracking-[0.12em] text-fd-muted-foreground uppercase">
            One immutable contract
          </p>

          <div className="mt-5 space-y-2">
            <ContractRow label="draftJson" detail="editable" tone="muted" />
            <ContractArrow label="publish" />
            <ContractRow label="publishedJson" detail="current" tone="muted" />
            <ContractArrow label="start response" />
            <ContractRow
              label="response.definition"
              detail="frozen"
              tone="primary"
            />
          </div>

          <div className="mt-5 rounded-xl border border-fd-primary/20 bg-fd-primary/[0.055] p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-fd-foreground">
              <LockKeyhole className="size-3.5 text-fd-primary" aria-hidden />
              Submit validates the stored definition
            </div>
            <code className="mt-3 block font-mono text-[0.7rem] leading-5 text-fd-muted-foreground">
              validate(data, response.definition)
            </code>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-fd-border/80 bg-fd-muted/35 px-5 py-3 text-[0.7rem] text-fd-muted-foreground sm:px-7">
          <Check className="size-3.5 text-fd-primary" aria-hidden />
          Later publishes never rewrite existing responses.
        </div>
      </div>
    </aside>
  );
}

function ContractRow({
  label,
  detail,
  tone,
}: {
  label: string;
  detail: string;
  tone: "muted" | "primary";
}) {
  return (
    <div
      className={
        tone === "primary"
          ? "flex items-center justify-between rounded-xl border border-fd-primary/25 bg-fd-primary/[0.07] px-4 py-3.5"
          : "flex items-center justify-between rounded-xl border border-fd-border bg-fd-background/55 px-4 py-3.5"
      }
    >
      <code className="font-mono text-xs font-medium text-fd-foreground">
        {label}
      </code>
      <span
        className={
          tone === "primary"
            ? "font-mono text-[0.65rem] text-fd-primary"
            : "font-mono text-[0.65rem] text-fd-muted-foreground"
        }
      >
        {detail}
      </span>
    </div>
  );
}

function ContractArrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pl-4 font-mono text-[0.62rem] text-fd-muted-foreground">
      <ArrowDown className="size-3" aria-hidden />
      {label}
    </div>
  );
}
