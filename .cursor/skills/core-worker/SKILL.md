---
name: core-worker
description: >-
  Guides edits to Worker A (workers/core): routes, D1 access, generation
  drivers, PDF compile, CORS, mock unlock. Use when changing the public HTTP
  API, PDF pipeline, or core worker tests.
---

# Core worker

## Map

| Area | Path |
| --- | --- |
| Entry / router | `workers/core/src/index.ts` |
| Routes | `workers/core/src/routes/` |
| DB helpers | `workers/core/src/db/` |
| Generation | `workers/core/src/generation/` |
| PDF | `workers/core/src/pdf/` |
| CORS / flags | `cors.ts`, `env-flags.ts` |
| Wrangler | `workers/core/wrangler.jsonc` |

API contract: [docs/api-core.md](../../../docs/api-core.md).

## Conventions

- MVP identity = `email` query/body; profile resolution in DB helpers.
- Keep error shapes consistent (`code` fields where already used: `LOCKED`, `BYOK`, `MOCK_UNLOCK_DISABLED`, …).
- Mock unlock route must stay gated by `ALLOW_MOCK_UNLOCK`.
- Prefer `node --test` + `*.test.ts` colocated; run `pnpm --filter @itineraryedge/core-worker test`.
- Shared types/validation live in `packages/shared` — change there when both web and worker need the shape.

## Do not

- Implement Stripe Checkout or webhooks here.
- Commit real secrets into `wrangler.jsonc`.
- Relax CORS for staging/production docs without `APP_ORIGIN` guidance.
