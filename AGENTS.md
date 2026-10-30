# AGENTS

Short entrypoint for Cursor and other coding agents working on **ItineraryEdge**.

## Stack snapshot

- pnpm monorepo: `apps/web` (Next.js / Pages), `workers/core` (Worker A), `packages/shared`, `migrations/` (D1)
- Cloudflare Pages + Workers + D1
- Paid unlock / Stripe: private [`itineraryedge-billing`](https://github.com/lazehang/itineraryedge-billing) only
- Status: **WIP — not production-ready**

## Non-negotiables

1. **No secrets in git** (Stripe keys, webhook secrets, real BYOK keys, account-specific D1 ids you should not publish).
2. **Mock unlock off in production** — do not set `ALLOW_MOCK_UNLOCK` or `NEXT_PUBLIC_ALLOW_MOCK_UNLOCK` on prod.
3. Commits include `Co-authored-by: lazehang <lazehang@gmail.com>` when following maintainer agent workflow.
4. Do not invent product decisions; escalate. Do not claim production-ready.

## Read next

- [docs/ai-playbook.md](docs/ai-playbook.md) — human + AI pipeline
- [`.cursor/rules/`](.cursor/rules/) — always-on Cursor rules
- [docs/security.md](docs/security.md) · [docs/staging-checklist.md](docs/staging-checklist.md) · [docs/README.md](docs/README.md)
