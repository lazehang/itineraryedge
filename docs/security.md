# Security

## Status

ItineraryEdge is **not production-ready**. A **security audit is in progress**; findings and remediations will be tracked outside this doc. **Do not** describe the project as fully audited or cite “Audit-4 complete” — that is **not** accurate for the current public core.

## Identity (MVP)

- **Email-as-identity:** API access for read/update/generate/PDF/unlock uses the **`email` query parameter** (or email in POST bodies for create/checkout).
- There is **no** password, magic link, OAuth, or signed session on the core worker in this iteration.
- Anyone who knows an itinerary id **and** the owner email can call the API. For self-host experiments, treat links as capabilities; do not expose this API to the open internet without additional controls you provide.

## Data handling

- **BYOK AI keys:** Browser keys live in **sessionStorage** only; optional server fallback via Wrangler **secrets** (`BYOK_AI_KEY`). Keys are not stored in D1.
- **D1** holds itinerary payloads and generation JSON; classify accordingly for your deployment.
- **PDFs** include travel disclaimers but are not official immigration documents.

## Secrets and payment boundary

| Secret / capability | Where it belongs |
| --- | --- |
| Stripe secret key, webhook signing secret | **Worker B only** ([`itineraryedge-billing`](https://github.com/lazehang/itineraryedge-billing)) |
| `BYOK_AI_KEY`, provider API keys | Core worker secrets (optional) |
| `ALLOW_MOCK_UNLOCK=1` | Core worker — **local/staging only**; disables paid-only unlock path enforcement on mock endpoint |
| Public URLs (`NEXT_PUBLIC_*`) | Pages — no Stripe secrets |

The public repository must **never** contain Stripe SDK server code, webhook handlers with signing secrets, or committed API keys.

## CORS (Worker A — staging / production)

Cross-origin browser calls to the core worker only receive `Access-Control-Allow-Origin` when the request `Origin` matches an allowlist. Configure worker vars before exposing staging or production:

| Variable | Required | Purpose |
| --- | --- | --- |
| `APP_ORIGIN` | **Yes** in staging and production | Primary web app origin (e.g. `https://app.example.com`) |
| `ALLOWED_ORIGINS` | Optional | Comma-separated extra origins (preview URLs, alternate hosts) |

If neither variable is set, local `wrangler dev` keeps permissive behavior (reflect any `Origin`, or `*` when no `Origin` header is sent). **Staging and production must set `APP_ORIGIN`** so arbitrary sites cannot read API JSON cross-origin (SEC-003). Disallowed `OPTIONS` preflight returns **403** without ACAO.

## Mock unlock gating

`POST /api/itineraries/:id/unlock-mock` returns **403** `MOCK_UNLOCK_DISABLED` unless `ALLOW_MOCK_UNLOCK=1` on the core worker. Production deployments should leave this unset.

## Reporting issues

For vulnerabilities, contact the maintainers privately rather than opening a public issue with exploit details. Public discussion of unfixed critical issues is discouraged until a fix is available.

## Hardening roadmap (non-exhaustive)

Auditors and contributors should expect future work on authenticated sessions, rate limiting, and stricter authorization — none of which are complete in the MVP described here.
