# AGENTS

Entrypoint for Cursor (and other) coding agents on **ItineraryEdge**.

This repo is **WIP — not production-ready**. Prefer **local** Cursor Agent chats over inventing cloud-only process.

## Start here (every session)

1. Read this file, then [docs/ai-playbook.md](docs/ai-playbook.md).
2. Apply always-on rules under [`.cursor/rules/`](.cursor/rules/).
3. Load the matching **project skill** under [`.cursor/skills/`](.cursor/skills/) for the task (see table below).
4. Do **not** invent product scope — escalate ambiguous product calls to maintainers.

## Stack snapshot

| Piece | Path | Role |
| --- | --- | --- |
| Web UI | `apps/web` | Next.js App Router → Cloudflare Pages |
| Worker A | `workers/core` | Public HTTP API (itineraries, generate, PDF, mock unlock) |
| Shared | `packages/shared` | Types, validators, display geo pricing |
| D1 | `migrations/` | Schema for `itineraryedge-global` |
| Worker B | private [`itineraryedge-billing`](https://github.com/lazehang/itineraryedge-billing) | Stripe Checkout + webhooks only |

## Non-negotiables

1. **No secrets in git** — Stripe keys, webhook secrets, real BYOK keys, private account-specific D1 ids.
2. **Mock unlock off in production** — never set `ALLOW_MOCK_UNLOCK` / `NEXT_PUBLIC_ALLOW_MOCK_UNLOCK` on prod.
3. **Payment stays in Worker B** — no Stripe SDK / webhook handlers in this public repo.
4. Agent commits include `Co-authored-by: lazehang <lazehang@gmail.com>` (maintainer workflow).
5. Do **not** claim production-ready or invent “audit complete” status.

## Local command cheat sheet

```bash
pnpm install
pnpm --filter @itineraryedge/core-worker exec wrangler d1 migrations apply itineraryedge-global --local
pnpm lint && pnpm typecheck && pnpm test
pnpm dev:core   # http://127.0.0.1:8787
pnpm dev:web    # http://localhost:3000
```

Health: `GET http://127.0.0.1:8787/health`

## Skills (project)

| Skill | Use when |
| --- | --- |
| [`drive-local`](.cursor/skills/drive-local/SKILL.md) | Any local prompt that should ship a slice end-to-end |
| [`local-dev`](.cursor/skills/local-dev/SKILL.md) | Bootstrap / restart / smoke the local stack |
| [`plan-slice`](.cursor/skills/plan-slice/SKILL.md) | Scoping a feature or bugfix before coding |
| [`implement-slice`](.cursor/skills/implement-slice/SKILL.md) | Implementing an approved or clearly scoped change |
| [`review-changes`](.cursor/skills/review-changes/SKILL.md) | Self-review or PR review |
| [`qa-acceptance`](.cursor/skills/qa-acceptance/SKILL.md) | Acceptance against local / preview URLs |
| [`core-worker`](.cursor/skills/core-worker/SKILL.md) | Editing `workers/core` |
| [`web-ui`](.cursor/skills/web-ui/SKILL.md) | Editing `apps/web` |
| [`d1-migrations`](.cursor/skills/d1-migrations/SKILL.md) | Changing D1 schema / migrations |
| [`shared-package`](.cursor/skills/shared-package/SKILL.md) | Editing `packages/shared` |

## Docs map

| Doc | Why |
| --- | --- |
| [docs/ai-playbook.md](docs/ai-playbook.md) | Human + agent pipeline for local prompts |
| [docs/architecture.md](docs/architecture.md) | System shape |
| [docs/api-core.md](docs/api-core.md) | Worker A HTTP API |
| [docs/security.md](docs/security.md) | Identity, CORS, secrets, mock unlock |
| [docs/staging-checklist.md](docs/staging-checklist.md) | Staging deploy recipe |
| [docs/contributing.md](docs/contributing.md) | PR / Co-authored-by |
| [docs/README.md](docs/README.md) | Full doc index |
