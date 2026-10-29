# Checkout contract (Pages ↔ Worker B)

This document describes the **public interface** between the ItineraryEdge web app (`apps/web`) and the **billing worker** (Worker B). It intentionally excludes Stripe secrets, webhook signing keys, and internal Worker B implementation.

Worker B repository: [`itineraryedge-billing`](https://github.com/lazehang/itineraryedge-billing).

## Configuration

| Client env | Purpose |
| --- | --- |
| `NEXT_PUBLIC_BILLING_WORKER_URL` | HTTPS origin of Worker B (no trailing slash) |
| `NEXT_PUBLIC_APP_URL` | Pages origin used to build return URLs |

If `NEXT_PUBLIC_BILLING_WORKER_URL` is unset, the UI reports `BILLING_NOT_CONFIGURED` and paid unlock is unavailable (mock unlock may still work in staging).

## Create Checkout session

**Request**

```http
POST {BILLING_WORKER_BASE}/api/checkout/session
Content-Type: application/json
```

```json
{
  "itineraryId": "uuid-or-id",
  "email": "traveler@example.com",
  "successUrl": "{APP_URL}/itineraries/{id}?email=…&checkout=success",
  "cancelUrl": "{APP_URL}/itineraries/{id}?email=…&checkout=cancel",
  "destinationCountry": "JP"
}
```

- `destinationCountry` is optional (ISO alpha-2); Worker B may use it for geo pricing at charge time.
- **No auth headers** are sent from the public web app today. Worker B **must** verify that `email` owns `itineraryId` (same D1 profile) before creating a session.

**Success response**

```json
{
  "checkoutUrl": "https://checkout.stripe.com/…"
}
```

Alternate accepted field: `"url"` instead of `"checkoutUrl"` (client accepts either).

**Error response**

Non-2xx with JSON body, e.g. `{ "error": "…", "code": "…" }`.

## Client behavior after redirect

- **successUrl** — Pages itinerary detail with `checkout=success`; UI polls/refreshes itinerary until `is_premium_unlocked` is true (webhook latency).
- **cancelUrl** — `checkout=cancel`; no unlock.

## Webhook side (Worker B only — not implemented in public core)

Worker B should handle Stripe webhooks and, idempotently:

1. Insert or update **ledger** rows with unique `stripe_checkout_session_id` and/or `stripe_event_id` (see migration `0004_ledger_stripe_ids.sql` in the public repo).
2. Set **`is_premium_unlocked = 1`** on the target itinerary row in D1.

The public core worker **does not** expose webhook endpoints and **must not** contain webhook secrets.

## Geo pricing note

The web UI shows indicative prices (HK$70 / €9 / $9 USD) from `packages/shared` geo helpers. **Worker B** is the source of truth for the Stripe Price/amount charged at Checkout.

## Out of scope for this contract

- Stripe API keys, webhook endpoints, and signature verification logic
- Refunds, disputes, and customer portal
- Any server-to-server call from core worker to Worker B (only the browser calls Worker B today)
