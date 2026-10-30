---
name: shared-package
description: >-
  Guides edits to packages/shared (types, validators, geo display pricing,
  travel-packet copy). Use when changing contracts consumed by both Worker A
  and the web app.
---

# Shared package

## Map

| Area | Path |
| --- | --- |
| Public exports | `packages/shared/src/index.ts` |
| Types | `types.ts`, `generation-types.ts` |
| Validation | `validation.ts`, `generation-validation.ts`, `same-day-guard.ts` |
| Display pricing | `geo-pricing.ts` |
| Copy / disclaimers | `travel-packet-copy.ts` |
| JSON schema | `packages/shared/schema/` |

## Conventions

- Shared code must stay free of Cloudflare Worker or Next.js runtime assumptions when possible.
- Any contract change that affects HTTP bodies or generation JSON → update [docs/api-core.md](../../../docs/api-core.md) and callers in `workers/core` / `apps/web`.
- Keep unit tests beside modules; run `pnpm --filter @itineraryedge/shared test` if present, else workspace `pnpm test`.
- Geo pricing here is **display** pricing helpers — not Stripe charge logic.
