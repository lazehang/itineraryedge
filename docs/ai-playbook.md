# AI playbook

How humans and AI agents collaborate on **ItineraryEdge**. This repo is **work in progress — not production-ready**.

## Roles

| Role | Owns |
| --- | --- |
| **Humans** | Product decisions, Cloudflare/Stripe secrets and deploys, public-launch security gate (separate from any code audit) |
| **Grok Bot product-build-pipeline** | Routes work through specialized agents |
| **Planner** | Scoped plans from requirements |
| **Designer** | UI/UX only when the slice changes user-facing UI |
| **Builder** | Implements approved plans via PRs |
| **Reviewer** | Code review for real blockers |
| **QA** | Acceptance checklist against PR / deploy URL / branch |

Typical flow: **Planner → (Designer if UI) → Builder → Reviewer → QA → merge**. Docs-only changes may skip QA when Reviewer agrees.

## Cursor agents

- Prefer Cursor cloud agents for repo work when available; otherwise follow maintainer direction (e.g. local laptop checkout).
- Cursor picks up [`.cursor/rules/`](../.cursor/rules/) and [AGENTS.md](../AGENTS.md).
- Keep product judgment with humans; agents implement and document, they do not invent scope.

## Review and QA expectations

- Address every valid Reviewer/QA finding with a code/PR fix, or reply on the PR explaining why an item is not valid — never silently ignore.
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before asking for re-review when code changed.
- Do not claim “Audit-4 complete” or production-ready status unless [security.md](./security.md) already states it (it currently does **not**).

## Pointers

| Doc / path | Why |
| --- | --- |
| [AGENTS.md](../AGENTS.md) | Short agent entrypoint |
| [`.cursor/rules/`](../.cursor/rules/) | Always-on Cursor rules |
| [security.md](./security.md) | Identity, secrets, CORS, mock unlock |
| [staging-checklist.md](./staging-checklist.md) | Staging deploy recipe (no live secrets) |
| [versioning.md](./versioning.md) | Changesets and releases (no npm publish) |
| [contributing.md](./contributing.md) | PR / Co-authored-by conventions |
