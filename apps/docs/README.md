# Docs

Public documentation site for this library. [Fumadocs](https://fumadocs.dev) renders MDX from `content/docs`. This app is not a published package. Maintainer checklists stay in [`docs/agents`](../../docs/agents).

## Run

From the repository root:

```bash
pnpm docs
```

http://localhost:3001

| Path                | Role                  |
| ------------------- | --------------------- |
| `content/docs`      | MDX pages             |
| `src/lib/source.ts` | Content loader        |
| `src/app/(home)`    | Landing page          |
| `src/app/docs`      | Docs layout and pages |
