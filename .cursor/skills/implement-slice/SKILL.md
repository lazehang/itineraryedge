---
name: implement-slice
description: >-
  Implements an approved or clearly scoped ItineraryEdge change with focused
  diffs and green quality gates. Use when coding a planned slice, applying a
  bug fix, or the user says implement / build / fix after a plan.
---

# Implement slice

## Before coding

1. Confirm scope (plan or clear bug). If ambiguous → `plan-slice` / escalate.
2. Load domain skill(s) for paths you will edit.
3. Skim neighboring code; match existing style — no drive-by refactors.

## While coding

- Keep the PR-sized change focused on the goal.
- Update docs when behavior or contracts change (`docs/api-core.md`, unlock/checkout docs, etc.).
- Add/adjust tests next to code (`*.test.ts` in workers/shared).
- Never add Stripe secrets, webhook handlers, or Stripe SDK here.

## Before handing off

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Then run `review-changes` (self). For user-visible behavior, run `qa-acceptance` (with `local-dev` if stack is down).

## Hand-off note

Summarize: files touched, how to verify, residual risks. **Do not commit** unless the human asked.
