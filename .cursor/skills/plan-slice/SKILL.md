---
name: plan-slice
description: >-
  Produces a scoped implementation plan for an ItineraryEdge feature or
  non-trivial bug fix. Use when the user asks to plan, design an approach,
  break down work, or before coding multi-file / API / unlock-adjacent changes.
---

# Plan slice

## Output format

Write a short plan (chat is enough unless the human asks for a doc file):

```markdown
## Goal
<one sentence>

## In scope
- …

## Out of scope
- … (explicit)

## Approach
1. …
2. …

## Touch points
| Area | Paths |
| --- | --- |
| Core / web / shared / migrations / docs | … |

## Risks / escalations
- Product? Security? Worker B?

## Test notes
- Unit: …
- Smoke: …
```

## Rules for planners

- Prefer smallest slice that delivers the goal.
- If unlock, Stripe, CORS, or auth semantics change → cite [docs/security.md](../../../docs/security.md) and flag human approval.
- Do not schedule Stripe implementation inside this public repo.
- UI changes: note whether Designer pass is needed; reuse existing `apps/web` patterns.
- Stop after the plan when scope is ambiguous or product-touching — ask the human to approve before `implement-slice`.

## Tiny work

Skip a formal plan for single-file typos/docs. Still list out-of-scope if tempted to expand.
