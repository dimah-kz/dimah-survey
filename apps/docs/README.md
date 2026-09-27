# Docs

Public documentation for this library, published at <https://survey.dimah.dev>. [Fumadocs](https://fumadocs.dev) renders MDX from `content/docs`. This app is not a published package. Maintainer checklists stay in [`docs/agents`](../../docs/agents).

## Run

From the repository root:

```bash
pnpm dev:docs
```

Local: <http://localhost:3001>. Production: <https://survey.dimah.dev>.

| Path                   | Role                                   |
| ---------------------- | -------------------------------------- |
| `content/docs`         | MDX pages                              |
| `src/lib/source.ts`    | Content loader                         |
| `src/lib/llm-intro.ts` | Agent decision sheet for `llms.txt`    |
| `src/lib/site-url.ts`  | Production, preview, and local origins |
| `src/app/(home)`       | Landing page                           |
| `src/app/docs`         | Docs layout and pages                  |
| `vercel.json`          | Monorepo install and build on Vercel   |

## Deploy

On Vercel, set the Root Directory to `apps/docs` and include source files outside that directory. Use Node.js 24.

`vercel.json` installs and builds from the repository root (`pnpm turbo run build --filter=docs`). Attach `survey.dimah.dev`. Production always uses that origin. Preview deploys stay on `VERCEL_URL` and are not indexed. Set `NEXT_PUBLIC_SITE_URL` only for a local tunnel or a non-production override.
