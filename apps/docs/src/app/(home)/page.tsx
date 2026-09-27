import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  FileClock,
  FilePenLine,
} from "lucide-react";

import { Flow } from "@/components/flow";
import { githubUrl, siteDescription, siteHeadline } from "@/lib/shared";

const surveyName = "SurveyJS";
const surveyUrl = "https://surveyjs.io/";

const lifecycle = [
  { name: "Author", kind: "data", note: "Creator writes draftJson" },
  { name: "Publish", kind: "server", note: "Promote publishedJson" },
  { name: "Start", kind: "server", note: "Freeze response.definition" },
  { name: "Fill", kind: "client", note: "SurveyJS renders the snapshot" },
  { name: "Submit", kind: "server", note: "Validate the same snapshot" },
] as const;

const features = [
  {
    icon: FilePenLine,
    title: "Explicit publishing",
    description:
      "Creator edits a draft. Respondents only see what you publish.",
  },
  {
    icon: FileClock,
    title: "Reproducible responses",
    description:
      "Each response keeps the survey it started with, and submit is validated against that copy.",
  },
  {
    icon: Blocks,
    title: "Runs in your app",
    description:
      "Your auth and your database. Adapters for Next.js, Hono, Express, Fastify, Elysia, SvelteKit, and Node.",
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

  return (
    <>
      {siteHeadline.slice(0, index)}
      <a
        href={surveyUrl}
        target="_blank"
        rel="noreferrer"
        className="text-fd-primary underline decoration-fd-primary/35 decoration-2 underline-offset-[0.14em] transition-colors hover:decoration-fd-primary"
      >
        {surveyName}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      {siteHeadline.slice(index + surveyName.length)}
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <section
        aria-labelledby="hero-heading"
        className="relative px-6 pt-20 pb-14 text-center sm:pt-28 sm:pb-16 lg:pt-32"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--color-fd-primary)_18%,transparent),transparent_68%)]"
        />
        <h1
          id="hero-heading"
          className="mx-auto max-w-4xl text-4xl leading-[1.08] font-semibold tracking-[-0.035em] text-balance text-fd-foreground sm:text-6xl"
        >
          <HeroHeading />
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-pretty text-fd-muted-foreground sm:text-lg sm:leading-8">
          {siteDescription}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/docs/quickstart"
            className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground shadow-[0_1px_0_color-mix(in_oklab,var(--color-fd-foreground)_12%,transparent)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-fd-primary/90 sm:w-auto"
          >
            Get started
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-fd-border bg-fd-background/75 px-5 text-sm font-medium text-fd-foreground backdrop-blur-sm transition-[background-color,border-color] hover:border-fd-primary/30 hover:bg-fd-muted sm:w-auto"
          >
            <GitHubIcon />
            View on GitHub
            <ArrowUpRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </div>
      </section>

      <section
        aria-label="Response lifecycle"
        className="mx-auto w-full max-w-5xl px-6"
      >
        <Flow label="One response" steps={[...lifecycle]} />
      </section>

      <section
        aria-label="Features"
        className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-24"
      >
        <ul className="grid gap-8 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <li key={title} className="border-t border-fd-border pt-6">
              <Icon
                aria-hidden
                strokeWidth={1.75}
                className="size-5 text-fd-primary"
              />
              <h2 className="mt-4 text-sm font-medium text-fd-foreground">
                {title}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-fd-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto border-t border-fd-border">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-6 py-6 text-sm text-fd-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
    </>
  );
}
