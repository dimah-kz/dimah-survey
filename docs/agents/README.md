# Maintainer agent docs

Not a map of the repo. Explore `packages/*/src` for what exists.

| Layer                                  | Role                                       |
| -------------------------------------- | ------------------------------------------ |
| Root [AGENTS.md](../../AGENTS.md)      | Always on. Invariants only.                |
| [.cursor/rules/](../../.cursor/rules/) | Landmines for the files being edited.      |
| This directory                         | Checklists when **changing the protocol**. |

If an agent can see it in source (paths, method names, current error codes), it does not belong here. Put **constraints** here, not a snapshot of the tree.

Stability policy lives only in [architecture.md](./architecture.md) **Before 1.0**.

| File                                 | Read when                                             |
| ------------------------------------ | ----------------------------------------------------- |
| [architecture.md](./architecture.md) | New package, or moving behavior across packages       |
| [packages.md](./packages.md)         | Routes, payloads, store methods, guard, or validation |
| [release.md](./release.md)           | Tegami changelog or npm publish                       |
