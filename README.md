# ItineraryEdge

Edge-hosted travel itinerary API and web UI on **Cloudflare** (Pages, Workers, D1): draft trips, optional AI-generated flight/hotel/sightseeing JSON, and travel-packet PDFs.

> **Work in progress** — APIs and UI may change; not production-ready.

> **Disclaimer:** PDFs and schedules produced by ItineraryEdge are **supporting travel packets only**. They are **not** visas, consular decisions, or guarantees of admission.

**Documentation:** [docs/README.md](docs/README.md) — architecture, self-host, BYOK/unlock, core API, checkout contract, contributing, security. Agent / AI workflow: [docs/ai-playbook.md](docs/ai-playbook.md). Staging recipe: [docs/staging-checklist.md](docs/staging-checklist.md).

## Quickstart

Requirements: **Node 20+**, **pnpm 10+**.

```bash
pnpm install

# Apply D1 migrations locally (see migrations/README.md)
pnpm --filter @itineraryedge/core-worker exec wrangler d1 migrations apply itineraryedge-global --local

pnpm lint && pnpm typecheck && pnpm test

# Terminal 1 — core worker (http://127.0.0.1:8787)
pnpm dev:core

# Terminal 2 — web app (http://localhost:3000)
pnpm dev:web
```

Copy [apps/web/.env.example](apps/web/.env.example) to `apps/web/.env.local` if you need to override public URLs.

Health check: [http://127.0.0.1:8787/health](http://127.0.0.1:8787/health)

**Self-host:** D1 + deploy core worker + Pages — see [docs/self-host.md](docs/self-host.md). Paid unlock uses private Worker B ([`itineraryedge-billing`](https://github.com/lazehang/itineraryedge-billing)); staging mock unlock uses `ALLOW_MOCK_UNLOCK=1` / `NEXT_PUBLIC_ALLOW_MOCK_UNLOCK=1` ([docs/byok-and-unlock.md](docs/byok-and-unlock.md)).

## License

[MIT](./LICENSE)
