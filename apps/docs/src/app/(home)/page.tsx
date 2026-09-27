import Link from "next/link";
import {
  ArrowRight,
  Braces,
  Camera,
  Database,
  Layers3,
  Server,
  ShieldCheck,
  Split,
} from "lucide-react";

import { Flow } from "@/components/flow";
import { githubUrl, siteDescription } from "@/lib/shared";

function GitHubIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const features = [
  {
    icon: Camera,
    kicker: "Snapshot",
    title: "The document stays put",
    body: "Start copies publishedJson onto the response. Later publishes do not rewrite that draft or a submitted row.",
  },
  {
    icon: Split,
    kicker: "Two handlers",
    title: "Fill and editor stay apart",
    body: "Respondents start and submit. The editor saves the draft and publishes. Neither route serves the other audience.",
  },
  {
    icon: ShieldCheck,
    kicker: "SurveyJS check",
    title: "Submit uses the snapshot",
    body: "The server runs clearIncorrectValues and validate on the stored definition, then saves that data.",
  },
] as const;

const packages = [
  {
    icon: Braces,
    name: "@dimah-survey/core",
    body: "Protocol, browser clients, schemas, errors, and store types.",
  },
  {
    icon: Server,
    name: "@dimah-survey/server",
    body: "Handlers, guards, validation, adapters, and local memory storage.",
  },
  {
    icon: Layers3,
    name: "@dimah-survey/react",
    body: "SurveyJS Model and Creator bindings without a renderer wrapper.",
  },
  {
    icon: Database,
    name: "@dimah-survey/db",
    body: "The SQL store and schema references that your app owns.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <section
        aria-labelledby="hero-heading"
        className="home-grid relative overflow-hidden pt-16 pb-14 text-center sm:pt-24 sm:pb-20"
      >
        <Link
          href="/docs/responses"
          className="group relative inline-flex items-center gap-2 rounded-full border border-fd-primary/20 bg-fd-background/85 px-3.5 py-1.5 text-xs font-medium text-fd-muted-foreground shadow-sm transition-colors hover:border-fd-primary/40 hover:text-fd-foreground"
        >
          <span className="size-1.5 rounded-full bg-fd-primary" />
          <span className="font-semibold text-fd-primary">Snapshot model</span>
          A later publish cannot rewrite a response
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <h1
          id="hero-heading"
          className="relative mx-auto mt-7 max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-balance text-fd-foreground sm:text-6xl sm:leading-[1.03]"
        >
          <span className="block">The survey can change.</span>
          <span className="block text-fd-primary">
            The response should not.
          </span>
        </h1>

        <p className="relative mx-auto mt-6 max-w-2xl text-base leading-relaxed text-balance text-fd-muted-foreground sm:text-lg">
          {siteDescription}
        </p>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/example"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground shadow-sm transition-colors hover:bg-fd-primary/90"
          >
            Run the example
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs/quickstart"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-fd-border bg-fd-background/85 px-4 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
          >
            Minimal integration
          </Link>
          <Link
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            <GitHubIcon />
            GitHub
          </Link>
        </div>

        <p className="relative mt-6 text-sm text-fd-muted-foreground">
          SurveyJS renders the survey and Creator. Your application owns auth,
          storage, and UI composition.
        </p>
      </section>

      <section
        aria-labelledby="lifecycle-title"
        className="border-b border-fd-border py-14 sm:py-18"
      >
        <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-center lg:gap-12">
          <div>
            <p className="font-mono text-xs font-medium tracking-[0.12em] text-fd-primary uppercase">
              One durable flow
            </p>
            <h2
              id="lifecycle-title"
              className="mt-3 text-2xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-3xl"
            >
              Publish once. Freeze on start. Validate on submit.
            </h2>
          </div>
          <div className="rounded-2xl border border-fd-border bg-fd-card/55 px-5 py-1 sm:px-6">
            <Flow
              label="Survey lifecycle"
              steps={[
                {
                  name: "Draft",
                  kind: "data",
                  note: "Creator writes draftJson",
                },
                {
                  name: "Publish",
                  kind: "server",
                  note: "Copy to publishedJson",
                },
                {
                  name: "Start",
                  kind: "server",
                  note: "Freeze definition",
                },
                {
                  name: "Fill",
                  kind: "client",
                  note: "SurveyJS renders",
                },
                {
                  name: "Submit",
                  kind: "server",
                  note: "Validate snapshot",
                },
              ]}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="features-title" className="py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-medium tracking-[0.12em] text-fd-primary uppercase">
            Server-owned history
          </p>
          <h2
            id="features-title"
            className="mt-3 text-2xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-3xl"
          >
            The guarantees a client-only survey cannot make.
          </h2>
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-fd-border bg-fd-card/50">
          <div className="grid divide-y divide-fd-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="p-6 sm:p-7">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="font-mono text-xs text-fd-muted-foreground">
                      {feature.kicker}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-fd-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                    {feature.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="packages-title"
        className="border-t border-fd-border py-16 sm:py-20"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-medium tracking-[0.12em] text-fd-primary uppercase">
              Small by design
            </p>
            <h2
              id="packages-title"
              className="mt-3 text-2xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-3xl"
            >
              Use only the layer your application needs.
            </h2>
          </div>
          <Link
            href="/docs/packages"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-fd-primary transition-colors hover:text-fd-foreground"
          >
            Explore the package map
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {packages.map((pkg) => {
            const Icon = pkg.icon;

            return (
              <article
                key={pkg.name}
                className="rounded-xl border border-fd-border bg-fd-card/45 p-5 transition-colors hover:border-fd-primary/30 hover:bg-fd-card"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-md bg-fd-background text-fd-primary ring-1 ring-fd-border">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <code className="font-mono text-xs font-medium text-fd-foreground">
                    {pkg.name}
                  </code>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-fd-muted-foreground">
                  {pkg.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="closing-cta-title"
        className="border-t border-fd-border py-16 text-center sm:py-20"
      >
        <p className="font-mono text-xs font-medium tracking-[0.12em] text-fd-muted-foreground uppercase">
          Start with a working flow
        </p>
        <h2
          id="closing-cta-title"
          className="mt-3 text-2xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-3xl"
        >
          See Creator, fill, and stored snapshots together.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-fd-muted-foreground sm:text-base">
          Run the reference app locally, then connect your own auth and database
          through the integration guide.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/example"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-fd-primary px-4 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            Run the example
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs/integration"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-fd-border bg-fd-background px-4 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
          >
            Mount the handlers
          </Link>
        </div>
      </section>
    </div>
  );
}
