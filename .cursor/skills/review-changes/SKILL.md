---
name: review-changes
description: >-
  Reviews ItineraryEdge diffs or PRs for real blockers: correctness, security
  boundaries, contract breaks, and missing tests. Use when the user asks for
  review, self-review before merge, or after implement-slice.
---

# Review changes

## Severity

- **Blocker** — must fix before merge (security, data loss, broken contract, false production-ready claims)
- **Should-fix** — clear bug or missing gate; fix in-slice when cheap
- **Nit** — style preference; do not block

## Checklist

- [ ] Diff matches stated goal; no scope creep
- [ ] No secrets, Stripe SDK, or webhook handlers introduced in this repo
- [ ] Mock unlock / `ALLOW_MOCK_UNLOCK` not enabled for production paths or docs that imply prod
- [ ] Email-as-identity treated as capability, not “auth complete”
- [ ] API/UI contract changes reflected in `docs/` when needed
- [ ] Tests cover new branches; `pnpm lint|typecheck|test` considered
- [ ] Worker A vs Worker B boundary respected
- [ ] Migrations additive / safe if present

## Output format

```markdown
## Verdict
Approve | Approve with nits | Request changes

## Blockers
- …

## Should-fix
- …

## Nits
- …
```

Address every valid finding with a code fix **or** an explicit why-invalid note — never silent ignore.
