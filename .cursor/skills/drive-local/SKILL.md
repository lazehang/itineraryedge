---
name: drive-local
description: >-
  Orchestrates an end-to-end ItineraryEdge slice from a local Cursor prompt:
  classify, plan if needed, implement, review, QA, and report. Use when the user
  asks to build, fix, ship, or drive work locally, or mentions following the AI
  playbook / AGENTS.md.
---

# Drive local

Run this skill for almost every non-trivial local prompt on this repo.

## 0. Orient

1. Read [AGENTS.md](../../../AGENTS.md) and [docs/ai-playbook.md](../../../docs/ai-playbook.md) if not already in context.
2. Respect always-on `.cursor/rules/` (secrets, mock unlock, Worker B boundary, no invented product).

## 1. Classify

| Kind | Next |
| --- | --- |
| Docs-only / typo | `implement-slice` (skip formal plan); Reviewer light; skip QA unless behavior docs claim new behavior |
| Clear bug with repro | Domain skill + `implement-slice` → `review-changes` → smoke via `qa-acceptance` if user-facing |
| Feature / multi-file / API contract | `plan-slice` → wait for human OK **if** scope is ambiguous or product-touching → `implement-slice` → `review-changes` → `qa-acceptance` |
| Review request | `review-changes` only |
| Verify / smoke | `local-dev` + `qa-acceptance` |

## 2. Load domain skills

Touching these paths ⇒ also read the skill:

- `workers/core` → `core-worker`
- `apps/web` → `web-ui`
- `migrations/` → `d1-migrations`
- `packages/shared` → `shared-package`
- Need running stack → `local-dev`

## 3. Execute

Follow the chosen skills in order. Keep the change set minimal. Escalate instead of inventing product rules (pricing, auth, Stripe, production flags).

## 4. Done report

When finished, tell the human:

1. What changed (paths / behavior)
2. Gates run (`lint` / `typecheck` / `test` / smoke)
3. Open risks or escalations
4. Whether commit/PR is ready (do **not** commit unless asked)

## Prompt template (for humans)

```text
Follow AGENTS.md + docs/ai-playbook.md. Use drive-local.

Goal: …
Constraints: …
Done when: …
```
