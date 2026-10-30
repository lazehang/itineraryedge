# Self-host on Cloudflare

Run ItineraryEdge on **your own** Cloudflare account. You need **Node 20+** and **pnpm 10+** for builds; runtime is Workers + Pages + D1.

## 1. Clone and install

```bash
git clone https://github.com/lazehang/itineraryedge.git
cd itineraryedge
pnpm install
```

## 2. D1 database

Create the database in the account where you will deploy the core worker:

```bash
wrangler d1 create itineraryedge-global
```

Copy the `database_id` from the command output into `workers/core/wrangler.jsonc` (replace the placeholder). **Do not commit** account-specific ids if you fork publicly with different ids.

Apply migrations — full commands are in [`migrations/README.md`](../migrations/README.md):

```bash
# Local dev
pnpm --filter @itineraryedge/core-worker exec wrangler d1 migrations apply itineraryedge-global --local

# Remote (after wrangler login in your environment)
pnpm --filter @itineraryedge/core-worker exec wrangler d1 migrations apply itineraryedge-global --remote
```

## 3. Deploy core worker (Worker A)

```bash
pnpm --filter @itineraryedge/core-worker deploy
```

Note the deployed worker URL (e.g. `https://itineraryedge-core.<your-subdomain>.workers.dev`).

Optional Wrangler **vars** / **secrets** on the core worker:

| Name | Purpose |
| --- | --- |
| `APP_ORIGIN` | **Required in staging/production** — primary Pages origin for CORS (see [security.md](./security.md#cors-worker-a--staging--production)) |
| `ALLOWED_ORIGINS` | Optional comma-separated extra CORS origins |
| `ALLOW_MOCK_UNLOCK` | Set to `1` only in local/staging to allow `POST …/unlock-mock` |
| `AI_PROVIDER` | `openai` or `anthropic` when using BYOK |
| `BYOK_AI_KEY` | Server-side AI fallback — `wrangler secret put BYOK_AI_KEY` |

## 4. Deploy web (Pages)

Pick **one** path for `apps/web` (Next.js App Router):

1. **Cloudflare dashboard (simplest for self-hosters):** create a Pages project → Framework preset **Next.js** → connect this GitHub repo → set root directory to `apps/web` (or monorepo build settings so `pnpm` installs from the repo root). Build/output follow the Next.js preset Cloudflare documents for your Next major.
2. **Wrangler + OpenNext (later / advanced):** `apps/web/wrangler.jsonc` notes adopting `@opennextjs/cloudflare` in a later iteration — use this when you intentionally leave the dashboard preset. Do not invent a custom deploy script that is not in the repo yet.

Until OpenNext is wired in-tree, prefer the **dashboard Next.js preset**. Either way, set **Pages environment variables** (public `NEXT_PUBLIC_*` only — never Stripe secrets):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CORE_WORKER_URL` | Core API base URL (**required**) |
| `NEXT_PUBLIC_APP_URL` | Public site origin for checkout return URLs, e.g. `https://your-project.pages.dev` |
| `NEXT_PUBLIC_BILLING_WORKER_URL` | Worker B base URL for paid unlock (omit if you only use mock unlock or skip polished PDF) |
| `NEXT_PUBLIC_ALLOW_MOCK_UNLOCK` | `1` only in local/staging to show demo unlock UI |

## 5. Billing worker (optional)

Paid **Pay to unlock** requires Worker B ([`itineraryedge-billing`](https://github.com/lazehang/itineraryedge-billing)) deployed separately with:

- The **same D1** binding as core (so webhooks can update `is_premium_unlocked` and ledger),
- Stripe keys and webhook secret configured **only** on Worker B.

See [byok-and-unlock.md](./byok-and-unlock.md) and [checkout-contract.md](./checkout-contract.md).

## 6. Local development (no deploy)

```bash
pnpm dev:core   # http://127.0.0.1:8787
pnpm dev:web    # http://localhost:3000
```

Health: [http://127.0.0.1:8787/health](http://127.0.0.1:8787/health)

Staging-style unlock without Stripe:

```bash
# workers/core — e.g. wrangler.jsonc vars: { "ALLOW_MOCK_UNLOCK": "1" }
# apps/web — NEXT_PUBLIC_ALLOW_MOCK_UNLOCK=1 in .env.local
```

## Quality gates before you ship

```bash
pnpm lint
pnpm typecheck
pnpm test
```
