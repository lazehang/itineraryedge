---
name: d1-migrations
description: >-
  Adds or adjusts D1 SQL migrations for itineraryedge-global. Use when changing
  schema, ledger columns, or applying local/remote migrations for Worker A /
  billing shared DB.
---

# D1 migrations

## Layout

- Files: `migrations/NNNN_description.sql` (sequential)
- Docs: [migrations/README.md](../../../migrations/README.md)
- Worker A Wrangler `migrations_dir` points at this folder
- Billing (Worker B) must use the **same** database id in its private config

## Adding a migration

1. Choose next `NNNN` after the highest existing file.
2. Prefer additive changes (new columns nullable) especially for Stripe/ledger fields Worker B writes.
3. Update any TypeScript/SQL assumptions in `workers/core/src/db/` and docs if columns are user-visible.
4. Apply locally before claiming done:

```bash
pnpm --filter @itineraryedge/core-worker exec wrangler d1 migrations apply itineraryedge-global --local
```

## Remote / staging

Humans own Cloudflare auth and real `database_id` values. Do not invent or commit private account ids. Remote apply is a maintainer step — see [docs/staging-checklist.md](../../../docs/staging-checklist.md).
