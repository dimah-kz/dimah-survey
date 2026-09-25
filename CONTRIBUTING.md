# Contributing

```bash
pnpm install
pnpm lint
pnpm check-types
pnpm test
pnpm format:check
```

Read [AGENTS.md](./AGENTS.md) before changing the protocol. Product constraints live in [docs/agents/](./docs/agents/).

The snapshot test in `packages/server/src/lifecycle.test.ts` is the template for every new adapter. A later publish must not change an existing response definition.
