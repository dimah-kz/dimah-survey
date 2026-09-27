import Link from "next/link";
import { ArrowRight, Camera, ShieldCheck, Split } from "lucide-react";

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

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <section
        aria-labelledby="hero-heading"
        className="pt-16 pb-12 text-center sm:pt-24 sm:pb-16"
      >
        <Link
          href="/docs/responses"
          className="group inline-flex items-center gap-2 rounded-full border border-fd-foreground/10 px-3.5 py-1.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:border-fd-foreground/20 hover:text-fd-foreground"
        >
          <span className="font-semibold text-fd-primary">Snapshot model</span>
          A later publish does not rewrite a response
          <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <h1
          id="hero-heading"
          className="mx-auto mt-7 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-balance text-fd-foreground sm:text-6xl sm:leading-[1.05]"
        >
          <span className="block">Response lifecycle for SurveyJS.</span>
          <span className="block text-fd-primary">
            The renderer stays yours.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-balance text-fd-muted-foreground sm:text-lg">
          {siteDescription}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/quickstart"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            Start building
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-fd-border bg-fd-background px-5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
          >
            <GitHubIcon />
            View on GitHub
          </Link>
        </div>

        <p className="mt-5 text-xs text-fd-muted-foreground">
          SurveyJS renders the survey and Creator. You own auth and the
          database.
        </p>
      </section>

      <section aria-labelledby="features-title" className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-medium tracking-[0.12em] text-fd-muted-foreground uppercase">
            Built for surveys that outlive the draft
          </p>
          <h2
            id="features-title"
            className="mt-3 text-2xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-3xl"
          >
            Every response keeps the document it started with.
          </h2>
        </div>

        <div className="mx-auto mt-10 overflow-hidden rounded-2xl border border-fd-border bg-fd-card">
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
        aria-labelledby="closing-cta-title"
        className="border-t border-fd-border py-16 text-center sm:py-20"
      >
        <p className="font-mono text-xs font-medium tracking-[0.12em] text-fd-muted-foreground uppercase">
          Start with one survey
        </p>
        <h2
          id="closing-cta-title"
          className="mt-3 text-2xl font-semibold tracking-tight text-balance text-fd-foreground sm:text-3xl"
        >
          Publish, then render with SurveyJS.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-fd-muted-foreground sm:text-base">
          Use in-memory persistence locally. Add a fill guard and a durable
          store before production.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/quickstart"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            Open the quickstart
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs/integration"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-fd-border px-5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
          >
            Mount the handlers
          </Link>
        </div>
      </section>
    </div>
  );
}
