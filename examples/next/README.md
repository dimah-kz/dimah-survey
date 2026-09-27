# Next.js example

A minimal consumer of `@dimah-survey/server`, `@dimah-survey/react`, and `@dimah-survey/db`.

Library guides: <https://survey.dimah.dev>.

SurveyJS renders the survey and Creator. Responses are stored in SQLite (`data/survey.db`) through Drizzle and `@dimah-survey/db`. The respondent is an httpOnly cookie.

## Run

From the repository root:

```bash
pnpm example
```

| Path                     | What it shows                                         |
| ------------------------ | ----------------------------------------------------- |
| `/`                      | Published surveys. Start, or continue the open draft. |
| `/r/[responseId]`        | Fill. Partial save, submit, discard, reopen.          |
| `/studio`                | Drafts, publish, archive.                             |
| `/studio/[id]`           | Creator autosave. Publish is a separate action.       |
| `/studio/[id]/responses` | Stored snapshots, not the live draft.                 |

Fill is mounted at `/api/survey`. The editor is mounted at `/api/admin/survey`. The studio guard is open so the demo needs no login.

The server applies `drizzle/` on startup. After a schema change, generate the next migration from this app:

```bash
pnpm --filter example-next db:generate
```
