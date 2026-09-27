# Docs

Public documentation for this library, published at <https://survey.dimah.dev>. [Fumadocs](https://fumadocs.dev) renders MDX from `content/docs`. This app is not a published package. Maintainer checklists stay in [`docs/agents`](../../docs/agents).

## Run

From the repository root:

```bash
pnpm dev:docs
```

Local: <http://localhost:3001>. Production: <https://survey.dimah.dev>.

| Path                | Role                  |
| ------------------- | --------------------- |
| `content/docs`      | MDX pages             |
| `src/lib/source.ts` | Content loader        |
| `src/app/(home)`    | Landing page          |
| `src/app/docs`      | Docs layout and pages |
