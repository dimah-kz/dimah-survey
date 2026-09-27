# Docs

Public documentation for dimah-survey, built with
[Fumadocs](https://fumadocs.dev) and published at
<https://survey.dimah.dev>. This application is not an npm package.

Maintainer protocol checklists stay in [`docs/agents`](../../docs/agents);
consumer guides live in `content/docs`.

## Local development

From the repository root:

```bash
pnpm dev:docs
```

Local: <http://localhost:3001>. Production: <https://survey.dimah.dev>.

| Path                   | Responsibility                                |
| ---------------------- | --------------------------------------------- |
| `content/docs`         | Consumer-facing MDX guides and reference      |
| `src/app/(home)`       | Minimal documentation landing                 |
| `src/app/docs`         | Fumadocs layout, rendering, and page metadata |
| `src/lib/shared.ts`    | Shared product copy and structured data       |
| `src/lib/llm-intro.ts` | `llms.txt` decision sheet and page order      |
| `src/lib/site-url.ts`  | Production, preview, and local origins        |
| `vercel.json`          | Monorepo install and production build         |

## Quality checks

```bash
pnpm --filter docs lint
pnpm --filter docs check-types
pnpm --filter docs build
```

Check `/`, `/docs/quickstart`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`,
`/llms-full.txt`, and at least one `/docs/<slug>.md` route after changing the
site shell or content loader.

## Vercel deployment checklist

- Set **Root Directory** to `apps/docs`.
- Enable access to source files outside the root directory.
- Use Node.js 24.
- Keep `vercel.json`; it installs and builds from the monorepo root.
- Attach the production domain `survey.dimah.dev`.
- Confirm preview responses include `noindex, nofollow`.
- Confirm production canonical URLs, sitemap, and Open Graph images use
  `https://survey.dimah.dev`.

Production always uses the canonical origin. Preview deployments use
`VERCEL_URL` and are not indexed. Set `NEXT_PUBLIC_SITE_URL` only for a local
tunnel or an intentional non-production override.
