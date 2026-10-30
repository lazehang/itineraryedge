---
name: web-ui
description: >-
  Guides edits to the Next.js web app (apps/web): App Router pages, components,
  and public env wiring to Worker A / billing. Use when changing UI flows,
  itinerary pages, or client calls to the core API.
---

# Web UI

## Map

| Area | Path |
| --- | --- |
| Routes | `apps/web/app/` (esp. `itineraries/`) |
| Components | `apps/web/components/` |
| Client/lib | `apps/web/lib/` |
| Env example | `apps/web/.env.example` |
| Pages Wrangler | `apps/web/wrangler.jsonc` |

## Conventions

- Call Worker A with the public core base URL; pass `email` as the API expects.
- BYOK keys: sessionStorage only if that pattern already exists — never persist keys in D1 from the browser.
- `NEXT_PUBLIC_ALLOW_MOCK_UNLOCK` only controls demo UI; production must leave it unset.
- Reuse existing itinerary page structure; avoid new design systems unless the human asks.
- No Stripe secret keys or server-side Stripe SDK in this package.

## Verify

```bash
pnpm --filter @itineraryedge/web lint
pnpm --filter @itineraryedge/web typecheck
```

Manual: `local-dev` + relevant `qa-acceptance` flows.
