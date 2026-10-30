---
name: qa-acceptance
description: >-
  Runs acceptance checks for an ItineraryEdge slice against local or preview
  URLs. Use when verifying a fix, smoking after implement-slice, or the user
  asks for QA / acceptance / manual test.
---

# QA acceptance

## Setup

Use `local-dev` if core/web are not running. Prefer local URLs unless the human gives a deploy/preview URL.

- Core: `http://127.0.0.1:8787`
- Web: `http://localhost:3000`

## Baseline smoke (adjust to the slice)

| Step | Pass criteria |
| --- | --- |
| Health | `GET /health` → ok |
| Create draft | Itinerary created for a test email |
| Generate | Mock generation persists without BYOK |
| Standard PDF | `GET .../pdf` returns `application/pdf` |
| Polished PDF (if in scope) | Locked → 403 `LOCKED` when not unlocked; OK after mock unlock **only** if mock flag on |

## Slice-specific

Derive 3–7 bullets from the plan’s “Test notes” / PR description. Mark each Pass / Fail / Skip (with reason).

## Report

```markdown
## Environment
local | preview <url>

## Results
- [ ] …
## Bugs found
- …
## Verdict
Pass | Pass with notes | Fail
```

Do not claim production readiness based on local smoke alone.
