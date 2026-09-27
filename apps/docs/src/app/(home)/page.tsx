import Link from "next/link";
import { ArrowRight, Blocks, FileClock, FilePenLine } from "lucide-react";
import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from "fumadocs-ui/components/codeblock";
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";

import { InstallCommand } from "@/components/install-command";
import { githubUrl, siteDescription, siteHeadline } from "@/lib/shared";

const installCommand = "npm i @dimah-survey/server @dimah-survey/react";

const examples = [
  {
    file: "route.ts",
    lang: "ts",
    code: `import { db } from "@dimah-survey/db";
import { dimahSurvey, guardRespondent } from "@dimah-survey/server";
import { toNextJsHandler } from "@dimah-survey/server/next";
import { getUser } from "@/lib/auth";
import { client } from "@/lib/db";

const fill = dimahSurvey({
  audience: "fill",
  database: db(client),
  guard: async (context) => {
    const user = await getUser(context.request);
    return guardRespondent(user.id)(context);
  },
});

export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(fill);`,
  },
  {
    file: "fill.tsx",
    lang: "tsx",
    code: `"use client";

import dynamic from "next/dynamic";
import { createFillClient, useSurveyResponse } from "@dimah-survey/react";

const Survey = dynamic(
  () => import("survey-react-ui").then((mod) => mod.Survey),
  { ssr: false },
);

const fillClient = createFillClient({ baseURL: "/api/survey" });

export function Fill({ responseId }: { responseId: string }) {
  const { model } = useSurveyResponse({ client: fillClient, responseId });
  return model ? <Survey model={model} /> : null;
}`,
  },
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

export default function HomePage() {
  return (
    <>
      <section
        aria-labelledby="hero-heading"
        className="px-6 pt-20 pb-14 text-center sm:pt-28 sm:pb-16 lg:pt-32"
      >
        <h1
          id="hero-heading"
          className="mx-auto max-w-4xl text-4xl leading-[1.08] font-semibold tracking-[-0.035em] text-balance text-fd-foreground sm:text-6xl"
        >
          {siteHeadline}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-pretty text-fd-muted-foreground sm:text-lg sm:leading-8">
          {siteDescription}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/docs/quickstart"
            className="group inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-fd-foreground px-4 text-sm font-medium text-fd-background transition-opacity hover:opacity-85 sm:w-auto"
          >
            Get started
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <InstallCommand command={installCommand} />
        </div>
      </section>

      <section aria-label="Example" className="mx-auto w-full max-w-3xl px-6">
        <CodeBlockTabs defaultValue={examples[0].file} className="my-0">
          <CodeBlockTabsList>
            {examples.map((example) => (
              <CodeBlockTabsTrigger key={example.file} value={example.file}>
                {example.file}
              </CodeBlockTabsTrigger>
            ))}
          </CodeBlockTabsList>
          {examples.map((example) => (
            <CodeBlockTab key={example.file} value={example.file}>
              <ServerCodeBlock code={example.code} lang={example.lang} />
            </CodeBlockTab>
          ))}
        </CodeBlockTabs>
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
