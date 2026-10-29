# D1 migrations

SQL migrations for the **itineraryedge-global** D1 database (profiles, itineraries, ledger).

Migration `0004` adds nullable unique Stripe ids on `global_ledger` for idempotent checkout/webhook writes from the private billing worker.

Worker A (`workers/core`) references this directory via `migrations_dir` in Wrangler.

```bash
# Local
pnpm --filter @itineraryedge/core-worker exec wrangler d1 migrations apply itineraryedge-global --local

# Remote (requires Cloudflare auth in your environment)
pnpm --filter @itineraryedge/core-worker exec wrangler d1 migrations apply itineraryedge-global --remote
```

Create the database in your account before applying remote migrations:

```bash
wrangler d1 create itineraryedge-global
```

Then set `database_id` in `workers/core/wrangler.jsonc` (use the id from the create output — never commit secrets).
