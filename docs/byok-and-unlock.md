# BYOK and polished PDF unlock

## BYOK (AI generation)

The web UI can store one AI key in **sessionStorage** only (`itineraryedge:byok:ai`). Generate requests send it as the `X-BYOK-Key` header. Keys are **not** written to D1 or localStorage.

On the core worker:

- Set `AI_PROVIDER` to `openai` or `anthropic`.
- Optionally set `BYOK_AI_KEY` via `wrangler secret put` as a server-side fallback (never commit).

If no key is present in the session or environment, generation uses the **mock** driver.

Generation errors may include `code: "BYOK"` (401) when a provider key is required but missing or invalid.

## Polished PDF access

| PDF | Requirement |
| --- | --- |
| Standard | Generation completed (`GET …/pdf?email=…`) |
| Polished | Same + `is_premium_unlocked` on the itinerary |

If generation has not run, PDF routes return **409** with `code: "NOT_GENERATED"`. If polished is requested while locked, **403** with `code: "LOCKED"`.

Download paths:

- `GET /api/itineraries/:id/pdf?email=…` (optional `variant=polished`)
- `GET /api/itineraries/:id/pdf/polished?email=…`

## Unlock modes (open core)

| Mode | Who sets `is_premium_unlocked` | UI |
| --- | --- | --- |
| **Production paid** | Worker B after Stripe webhook | **Pay to unlock** → Stripe Checkout on billing worker; return URLs on Pages (`?checkout=success\|cancel`) |
| **Staging mock** | Core `POST …/unlock-mock` when `ALLOW_MOCK_UNLOCK=1` | Secondary **Demo unlock (staging)** + **Test checkout** chip when `NEXT_PUBLIC_ALLOW_MOCK_UNLOCK=1` |
| **Self-host without billing** | Optional mock locally, or use standard PDF only | Leave billing URL unset; enable mock only in non-prod |

### Mock unlock (core worker)

```http
POST /api/itineraries/:id/unlock-mock?email=…
```

- Allowed only when core env `ALLOW_MOCK_UNLOCK=1`.
- Otherwise **403** with `code: "MOCK_UNLOCK_DISABLED"`.
- Idempotent: sets `is_premium_unlocked` and writes a ledger row with source `mock_unlock` (no Stripe).

Response shape includes `{ itinerary, unlock: { mock: true, alreadyUnlocked } }`.

### Paid unlock (Worker B)

The web app calls Worker B to start Checkout — see [checkout-contract.md](./checkout-contract.md). After payment, Worker B (via webhook) should:

1. Write ledger rows with unique `stripe_checkout_session_id` / `stripe_event_id` (migration `0004`),
2. Set `is_premium_unlocked` on the itinerary.

The public core repo does **not** implement webhooks or Stripe SDK calls.

## Geo display pricing (UI only)

Actual charges are determined on **Worker B** at Checkout. The shared helper `resolveGeoPricingDisplay` drives **copy** on the Travel packet card:

| Destination (ISO alpha-2) | Display |
| --- | --- |
| Hong Kong (`HK`, or `HKG` normalized to `HK`) | HK$70 |
| Eurozone members (see `packages/shared/src/geo-pricing.ts`) | €9 |
| Else | $9 USD |
| Unknown / missing country | “Price shown at checkout” |

This is display pricing only; Worker B must enforce the real Stripe price and currency.

## Secrets boundary

**No Stripe secret keys, webhook secrets, or Stripe SDK server code belong in the public ItineraryEdge repository.**
