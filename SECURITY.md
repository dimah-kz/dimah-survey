# Security Policy

## Supported versions

`@dimah-survey/core`, `@dimah-survey/server`, `@dimah-survey/react`, and
`@dimah-survey/db` release together as one version line.

| Version            | Supported |
| ------------------ | --------- |
| `main`             | Yes       |
| Latest npm release | Yes       |
| Earlier releases   | No        |

## Reporting a vulnerability

Do not open a public issue, pull request, or discussion.

Report privately through
[GitHub security advisories](https://github.com/dimah-kz/dimah-survey/security/advisories/new).
Include:

- The affected package and version (`main` or an npm version)
- What an attacker can do, and what they already need
- Steps to reproduce, or a proof of concept
- Impact on draft, publish, the response snapshot, or submit
- A suggested fix, if you have one

We aim to acknowledge a report within 3 business days, then send a remediation
plan after triage. Please give us a chance to publish a fix before any public
disclosure.

We credit reporters in the advisory unless you ask to stay anonymous.

## Scope

In scope:

- The four published packages and their npm artifacts
- Publish not rewriting an existing `response.definition`
- Submit validation running on the stored definition
- Fill and editor audience separation in `@dimah-survey/server`
- The Publish workflow and npm Trusted Publishing (OIDC)

Out of scope:

- SurveyJS (`survey-core`, `survey-react-ui`, Creator)
- Auth, hosting, and the `guard` implemented by a consumer
- The documentation site and the example app
- A vulnerability that requires the consumer to install a modified dependency

Conduct reports belong in [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
