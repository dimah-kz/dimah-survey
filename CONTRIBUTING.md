# Contributing

Thanks for your interest in contributing to this project.

## Where to ask

| Topic                  | Where                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| Documentation          | [survey.dimah.dev](https://survey.dimah.dev)                        |
| Usage question         | [Discussions](https://github.com/dimah-kz/dimah-survey/discussions) |
| Bug or feature         | Issue forms (blank issues are disabled)                             |
| Security vulnerability | [SECURITY.md](./SECURITY.md)                                        |

Search open issues and discussions before opening a new one.

## Prerequisites

- Node.js 24+
- pnpm 12+

## Development setup

```bash
pnpm install
```

## Useful commands

```bash
pnpm build
pnpm check-types
pnpm lint
pnpm format:check
pnpm sherif
pnpm knip
pnpm test
```

`pnpm build` compiles workspace packages. Run commands for a specific package:

```bash
pnpm --filter @dimah-survey/core build
pnpm --filter @dimah-survey/core check-types
```

## Documentation

Package READMEs are concise npm entry points. The public site is
[survey.dimah.dev](https://survey.dimah.dev), sourced from `apps/docs`
(Fumadocs). Maintainer checklists under `docs/agents/` apply when changing
published behavior:

- `packages.md` for protocols, endpoints, and validation
- `architecture.md` for package boundaries
- `release.md` for Tegami and publishing

Do not hand-edit package `CHANGELOG.md` files or `.tegami/publish-lock.yaml`.

`packages/server/src/store.contract.test.ts` protects the lifecycle invariants.
`packages/server/src/adapters/adapters.test.ts` is the template for runtime
adapter coverage. A later publish must never change an existing response
definition.

## Issues

Use the **Bug report**, **Feature request**, or **Documentation** forms. New
issues are labeled `needs triage`. Do not file public issues for security
problems — see [SECURITY.md](./SECURITY.md).

Pull requests are labeled from the paths they change: `pkg:core`,
`pkg:server`, `pkg:db`, `pkg:react`, `documentation`, `area:ci`,
`area:example`, `area:tooling`, `dependencies`, or `release`.

## Contribution workflow

`main` is the release branch. Changes land through a pull request. CI must
pass, history stays linear, and the merge method is squash.

1. Fork the repository and create a branch from `main`.
2. Make your changes with focused commits.
3. Add or update tests and docs where needed.
4. Add a Tegami changelog for user-facing package changes.
5. Open a pull request.

## Changelogs (required for package changes)

When your PR changes behavior, API, or package output, add a changelog:

```bash
pnpm tegami
```

Then choose `group:dimah-survey` and a bump. The packages are on npm and still before `1.0.0`. See [docs/agents/architecture.md](./docs/agents/architecture.md) **Before 1.0**. Ship the current API in the same change.

- `patch` — a fix that leaves existing call sites working.
- `minor` — a feature, or any change existing consumer code must follow.
- `major` — publishes `1.0.0`. Leave it unused until that release.

A changelog file is created in `.tegami/` and must be committed with your PR. CI comments a release preview on the PR.

## Pull Request checklist

- [ ] Build passes (`pnpm build`)
- [ ] Type checks pass (`pnpm check-types`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Format check passes (`pnpm format:check`)
- [ ] Workspace checks pass (`pnpm sherif` / `pnpm knip`)
- [ ] Tests pass (`pnpm test`)
- [ ] Docs updated (if needed)
- [ ] Changelog added (if package behavior changed)

## Code of Conduct

By participating, you agree to follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
