# Staging checklist

Recipe for a **staging** environment. Humans own Cloudflare and Stripe secret values — this doc does not contain secrets.

Live Stripe end-to-end is **deferred** until staging exists and is provisioned.

## 1. D1

1. Create a real D1 database: `wrangler d1 create itineraryedge-global`
2. Replace `00000000-0000-0000-0000-000000000000` placeholders in:
   - `workers/core/wrangler.jsonc`
   - the billing worker Wrangler config in [`itineraryedge-billing`](https://github.com/lazehang/itineraryedge-billing)
3. Apply migrations (see [migrations/README.md](../migrations/README.md)):

```bash
pnpm --filter @itineraryedge/core-worker exec wrangler d1 migrations apply itineraryedge-global --remote
```

Core and billing must bind the **same** D1 database.

## 2. Deploy

| Service | Notes |
| --- | --- |
| Core Worker (Worker A) | `pnpm --filter @itineraryedge/core-worker deploy` |
| Pages (`apps/web`) | Dashboard Next.js preset or OpenNext — see [self-host.md](./self-host.md) |
| Billing Worker (Worker B) | Deploy from private `itineraryedge-billing` |

Publish a real staging URL once Pages is provisioned (e.g. `https://….pages.dev`).

## 3. CORS / origins

Set **`APP_ORIGIN`** on Worker A **and** Worker B to the staging Pages origin. Optionally set `ALLOWED_ORIGINS` for preview hosts. See [security.md](./security.md).

## 4. Mock unlock flags

| Env | Where | Staging | Production |
| --- | --- | --- | --- |
| `ALLOW_MOCK_UNLOCK=1` | Core worker vars | Optional (demo unlock) | **Unset** |
| `NEXT_PUBLIC_ALLOW_MOCK_UNLOCK=1` | Pages env | Optional (show demo UI) | **Unset** |

Never leave mock unlock enabled on production.

## 5. Public Pages env (placeholders only)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CORE_WORKER_URL` | Deployed Worker A base URL (**required**) |
| `NEXT_PUBLIC_APP_URL` | Staging site origin (checkout return URLs) |
| `NEXT_PUBLIC_BILLING_WORKER_URL` | Deployed Worker B base URL (paid unlock) |
| `NEXT_PUBLIC_ALLOW_MOCK_UNLOCK` | `1` only if staging demo unlock is intentional |

## 6. Stripe (test mode)

- Use **Stripe test mode** and **staging webhooks** only on Worker B.
- Stripe secret key and webhook signing secret stay on Worker B — never in this public repo.
- Wire checkout return URLs to `NEXT_PUBLIC_APP_URL` as documented in [checkout-contract.md](./checkout-contract.md).

## 7. After staging is up

- Smoke: health on Worker A, create draft, generate, standard PDF.
- Optional: mock unlock or test Checkout for polished PDF.
- Live production Stripe E2E waits on a separate public-launch security gate (human-owned).
