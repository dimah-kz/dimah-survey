---
description: dimah-survey library monorepo — invariants only; explore packages/*/src, open docs/agents to change the protocol
alwaysApply: true
---

# dimah-survey

This repository **is the library**, not an app. It is not part of `@dimah-form/*`.

Explore `packages/*/src` for how things work. [docs/agents/](docs/agents/) is **checklists for changing the protocol** — not a map of the repo.

pnpm + Turbo. From the root: `pnpm lint`, `pnpm check-types`, `pnpm test`.

## Invariants

- Backend for SurveyJS JSON. SurveyJS owns the survey schema, renderer, and Creator. This repo owns publish, the per-response definition snapshot, drafts, and submit.
- Do not translate SurveyJS JSON into dimah-form fields, and do not import `@dimah-form/*`.
- Protocol SSOT is `@dimah-survey/core`. HTTP is better-call on the server and better-fetch on the client. Do not add a second router or a hand-rolled `fetch` wrapper.
- `draftJson` is the editor copy. `publishedJson` is what new responses clone. Saving a draft must not change `publishedJson` or any existing `response.definition`.
- Submit validation runs on `response.definition`, never on the live draft or the latest publish. `validateResult` is required. `survey-core` belongs in `server` when that check is implemented, not in `core`.
- Partial save replaces `survey.data`. It is not a key patch.
- Auth lives in the consumer `guard`. Persistence is the `database` adapter. `memoryAdapter()` is in `server`. `db(client)` from `@dimah-survey/db` is the SQL store. No ORM inside `server`.
- Do not wrap or re-export the SurveyJS renderer. The React fill hook, when it exists, only hydrates a Model from the snapshot.
- Published packages are `@dimah-survey/core`, `server`, `react`, and `db`. They version together through Tegami (`docs/agents/release.md`). Build output is `dist` via tsup. Do not hand-edit `CHANGELOG.md` or `.tegami/publish-lock.yaml`.
- Still under construction and not on npm. Ship the current design and delete the previous API in the same change. Policy: [architecture.md](docs/agents/architecture.md) **Pre-release** — replace that section after the first publish.
- Commit when asked. Never `git push` unless the human explicitly asks.

`examples/` stays empty until a consumer app is worth showing. `docs/agents/` = these checklists. `tooling/` = shared ESLint, TypeScript, tsup, and Vitest config.

## Checklists

Read the matching file **when changing the protocol**. Skip it for a local fix — match the surrounding code.

| File                                           | Read when                                             |
| ---------------------------------------------- | ----------------------------------------------------- |
| [architecture.md](docs/agents/architecture.md) | New package, or moving behavior across packages       |
| [packages.md](docs/agents/packages.md)         | Routes, payloads, store methods, guard, or validation |
| [release.md](docs/agents/release.md)           | Tegami changelog or npm publish                       |
