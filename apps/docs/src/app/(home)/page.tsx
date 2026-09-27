import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { githubUrl, siteDescription, siteHeadline } from "@/lib/shared";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const surveyName = "SurveyJS";
const surveyUrl = "https://surveyjs.io/";

const features = [
  {
    title: "Explicit publishing",
    description:
      "The editor works on a draft. Respondents can start a survey only after you publish it.",
  },
  {
    title: "Reproducible responses",
    description:
      "Each response keeps the survey it started with. A later publish does not change that copy, and submit is checked against it.",
  },
  {
    title: "Runs in your app",
    description:
      "Authentication and the database stay yours. Adapters cover Next.js, Hono, Express, Fastify, Elysia, SvelteKit, and Node.",
  },
] as const;

function GitHubIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function HeroHeading() {
  const index = siteHeadline.lastIndexOf(surveyName);
  if (index === -1) return siteHeadline;

  const prefix = siteHeadline.slice(0, index);
  const bridgeAt = prefix.lastIndexOf("for");
  const suffix = siteHeadline.slice(index + surveyName.length);
  const name = (
    <a
      href={surveyUrl}
      target="_blank"
      rel="noreferrer"
      className="text-fd-primary italic no-underline transition-colors hover:text-fd-primary/80"
    >
      {surveyName}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );

  if (bridgeAt === -1) {
    return (
      <>
        {prefix}
        {name}
        {suffix}
      </>
    );
  }

  return (
    <>
      <span className="block">{prefix.slice(0, bridgeAt).trim()}</span>
      <span className="block">
        {prefix.slice(bridgeAt).trim()} {name}
        {suffix}
      </span>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="relative flex flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-14 -z-10 h-128 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-fd-primary)_11%,transparent),transparent_70%)]"
      />

      <section
        aria-labelledby="hero-heading"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center-safe px-6 py-16 sm:py-20"
      >
        <div className="grid w-full gap-14 lg:grid-cols-[max-content_minmax(0,1fr)] lg:items-start lg:gap-x-20">
          <div className="max-w-lg">
            <h1
              id="hero-heading"
              className={cn(
                display.className,
                "text-[3.25rem] leading-[1.02] font-normal tracking-[-0.02em] text-fd-foreground sm:text-6xl lg:text-[4.15rem]",
              )}
            >
              <HeroHeading />
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-pretty text-fd-muted-foreground">
              {siteDescription}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              <Link
                href="/docs/quickstart"
                className="group inline-flex h-10 items-center justify-center gap-2 rounded-md bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
              >
                Get started
                <ArrowRight
                  aria-hidden
                  strokeWidth={1.75}
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex h-10 items-center justify-center gap-2 rounded-md border border-fd-border px-4 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
              >
                <GitHubIcon />
                View on GitHub
                <ArrowUpRight
                  aria-hidden
                  strokeWidth={1.75}
                  className="size-3.5 text-fd-muted-foreground transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px"
                />
              </a>
            </div>
          </div>

          <ul className="divide-y divide-fd-border border-t border-fd-border lg:border-t-0 lg:border-l lg:pl-14">
            {features.map(({ title, description }, index) => (
              <li
                key={title}
                className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 py-5 first:pt-6 last:pb-0 lg:py-6 lg:first:pt-0"
              >
                <span
                  aria-hidden
                  className="pt-1 font-mono text-[11px] tracking-[0.16em] text-fd-muted-foreground tabular-nums"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="text-[15px] font-medium tracking-[-0.02em] text-fd-foreground">
                    {title}
                  </h2>
                  <p className="mt-1.5 max-w-md text-sm leading-6 text-pretty text-fd-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-fd-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-5 text-[13px] text-fd-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Released under the MIT License.</p>
          <nav aria-label="Footer" className="flex items-center gap-5">
            <Link
              href="/docs"
              className="transition-colors hover:text-fd-foreground"
            >
              Documentation
            </Link>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-fd-foreground"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
