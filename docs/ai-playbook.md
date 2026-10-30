# AI playbook

How humans and AI agents collaborate on **ItineraryEdge**. Status: **work in progress — not production-ready**.

This playbook is written so a **local Cursor Agent** can drive a slice from a single prompt: classify → plan → implement → review → QA → hand off.

## Mental model

| Layer | Location | Job |
| --- | --- | --- |
| Entrypoint | [AGENTS.md](../AGENTS.md) | Stack, non-negotiables, skill index |
| Always-on rules | [`.cursor/rules/`](../.cursor/rules/) | Hard constraints every turn |
| Skills | [`.cursor/skills/`](../.cursor/skills/) | Step-by-step workflows for common work |
| Domain docs | [docs/](./README.md) | Architecture, API, security, staging |

Agents implement and document. **Humans** own product decisions, Cloudflare/Stripe secrets, deploys, and any public-launch security gate.

## Local-first workflow

Prefer a local Agent chat in this repo checkout. Cloud agents are optional when the maintainer directs them; do not block on cloud availability.

### Default pipeline

```text
Prompt → drive-local
  ├─ tiny / docs-only / clear bugfix  → implement-slice → review-changes → (qa if behavior)
  └─ feature / multi-file / ambiguous → plan-slice → (human OK if needed)
                                        → implement-slice → review-changes → qa-acceptance
```

Load domain skills when touching those trees: `core-worker`, `web-ui`, `d1-migrations`, `shared-package`, `local-dev`.

### Roles (same person or subagents)

| Role | Owns | Skill |
| --- | --- | --- |
| **Planner** | Scoped plan, out-of-scope list, test notes | `plan-slice` |
| **Designer** | UI/UX only when the slice changes user-facing UI | (follow `web-ui` + existing UI patterns) |
| **Builder** | Implements the plan; quality gates green | `implement-slice` |
| **Reviewer** | Real blockers only (security, correctness, contract break) | `review-changes` |
| **QA** | Acceptance against local / preview URL | `qa-acceptance` |

Docs-only changes may skip QA when Reviewer agrees. Tiny typo/docs fixes may skip formal Planner output but still respect non-negotiables.

## How to prompt locally

Paste a prompt that states **goal**, **constraints**, and **done definition**. Example:

```text
Follow AGENTS.md and docs/ai-playbook.md. Use the drive-local skill.

Goal: <one sentence>
Constraints: stay in <paths>; no product invention; no Stripe in this repo
Done when: <acceptance bullets>; pnpm lint/typecheck/test green
```

Shorter prompts still work if they name the skill and the goal; the agent should fill gaps from this playbook rather than inventing product scope.

### Classification cheat sheet

| Signal in the prompt | Route |
| --- | --- |
| “plan”, “design approach”, multi-area feature | `plan-slice` first |
| “fix”, “bug”, clear repro | `implement-slice` (+ domain skill) |
| “review this”, PR URL, diff | `review-changes` |
| “verify”, “smoke”, “QA” | `qa-acceptance` + `local-dev` |
| “migrations”, “D1”, schema | `d1-migrations` |
| “unlock”, “Stripe”, “checkout”, “CORS” | re-read [security.md](./security.md); never add Worker B secrets here |

## Quality bar (before claiming done)

1. `pnpm lint && pnpm typecheck && pnpm test`
2. If API/UI behavior changed: smoke with `local-dev` (health → draft → generate → PDF as relevant)
3. Address every valid Reviewer/QA finding with a fix **or** an explicit reply why it is invalid — never silent ignore
4. Do **not** claim “Audit-4 complete” or production-ready unless [security.md](./security.md) already states it (it does **not**)

## Escalation (stop and ask humans)

- New monetization / pricing / unlock product rules
- Auth model changes beyond documenting email-as-identity MVP
- Anything requiring Stripe secrets, live webhooks, or edits in `itineraryedge-billing`
- Production env flags (`ALLOW_MOCK_UNLOCK`, CORS origins, D1 ids)
- Ambiguous UX that would invent a new product surface

## Commits and PRs

- Follow [contributing.md](./contributing.md)
- Maintainer agent commits include: `Co-authored-by: lazehang <lazehang@gmail.com>`
- Only commit / open PRs when the human asks
- Prefer focused PRs; docs-only when documenting without code

## Pointers

| Doc / path | Why |
| --- | --- |
| [AGENTS.md](../AGENTS.md) | Short agent entrypoint + skill table |
| [`.cursor/skills/`](../.cursor/skills/) | Invokable workflows |
| [`.cursor/rules/`](../.cursor/rules/) | Always-on / path-scoped rules |
| [security.md](./security.md) | Identity, secrets, CORS, mock unlock |
| [staging-checklist.md](./staging-checklist.md) | Staging deploy recipe (no live secrets) |
| [versioning.md](./versioning.md) | Changesets / releases (no npm publish) |
| [contributing.md](./contributing.md) | PR conventions |
