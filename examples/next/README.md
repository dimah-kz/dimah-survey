# Next.js example

Reference application for the dimah-survey backend on Next.js.

SurveyJS renders the form and Creator. The app mounts fill and editor, stores
surveys in SQLite through Drizzle, and identifies the respondent with an
httpOnly cookie.

## Run

From the repository root:

```bash
pnpm example
```

Open [http://localhost:3000](http://localhost:3000). The app creates
`data/survey.db` and seeds a welcome survey.

## Routes

| Path                           | Demonstrates                                           |
| ------------------------------ | ------------------------------------------------------ |
| `/`                            | Published surveys; start or resume the open draft      |
| `/r/[responseId]`              | Partial save, submit, abandon, and reopen              |
| `/studio`                      | Survey creation, publish, archive, and status          |
| `/studio/[surveyId]`           | Creator autosave with explicit publish                 |
| `/studio/[surveyId]/responses` | Response summaries and the survey stored with each one |

Fill is mounted at `/api/survey`; editor is mounted separately at
`/api/admin/survey`.

> The Studio guard is intentionally open so the example runs without an auth
> provider. Protect the editor instance in a real application.

## Integration map

- `lib/survey.ts` — shared SQL store, fill/editor instances, and seed
- `lib/clients.ts` — browser clients with matching base paths
- `components/fill-survey.tsx` — response binding and stale-write UI
- `components/survey-designer.tsx` — Creator autosave and explicit publish
- `db/schema.ts` — application-owned schema and indexes
- `lib/respondent.ts` — cookie-derived respondent identity

The server applies `drizzle/` migrations on startup. After a schema change,
generate the next migration from this app:

```bash
pnpm --filter example-next db:generate
```

For the library integration, start with the
[quickstart](https://survey.dimah.dev/docs/quickstart).
