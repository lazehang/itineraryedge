---
name: local-dev
description: >-
  Bootstraps and smokes the local ItineraryEdge stack (pnpm, D1 local
  migrations, core worker on :8787, web on :3000). Use when starting the app,
  debugging local setup, applying local migrations, or verifying health before
  QA.
---

# Local dev

## Prerequisites

- Node 20+, pnpm 10+
- Copy `apps/web/.env.example` → `apps/web/.env.local` only if public URL overrides are needed

## Bootstrap

```bash
pnpm install
pnpm --filter @itineraryedge/core-worker exec wrangler d1 migrations apply itineraryedge-global --local
pnpm lint && pnpm typecheck && pnpm test
```

## Run (two terminals)

```bash
pnpm dev:core   # http://127.0.0.1:8787
pnpm dev:web    # http://localhost:3000
```

## Smoke

1. `GET http://127.0.0.1:8787/health` → `ok`, `d1Bound` true when DB applied
2. Optional: `GET http://127.0.0.1:8787/` for route discovery
3. In UI: create draft → generate (mock without BYOK) → download standard PDF
4. Mock unlock / polished PDF only if `ALLOW_MOCK_UNLOCK=1` on core and (optionally) `NEXT_PUBLIC_ALLOW_MOCK_UNLOCK=1` on web — **local/staging only**

## Env reminders

| Flag | Where | Note |
| --- | --- | --- |
| `ALLOW_MOCK_UNLOCK=1` | Worker A | Enables `POST .../unlock-mock` |
| `NEXT_PUBLIC_ALLOW_MOCK_UNLOCK=1` | Pages | Shows demo unlock UI |
| `NEXT_PUBLIC_CORE_WORKER_URL` | Pages | Defaults toward local core if unset — check `.env.example` |

Never recommend these mock flags for production. Staging recipe: [docs/staging-checklist.md](../../../docs/staging-checklist.md).
