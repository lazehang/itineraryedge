# ItineraryEdge documentation

Plain markdown reference for the open-core **ItineraryEdge** monorepo ([GitHub](https://github.com/lazehang/itineraryedge)). For a quick local start, see the [root README](../README.md).

## Contents

| Page | Summary |
| --- | --- |
| [architecture.md](./architecture.md) | Pages, core worker, D1, private billing sidecar, BYOK, PDF pipeline |
| [self-host.md](./self-host.md) | Deploy core worker and Pages on your Cloudflare account |
| [byok-and-unlock.md](./byok-and-unlock.md) | AI BYOK, mock unlock, paid unlock via Worker B, geo display pricing |
| [api-core.md](./api-core.md) | Public HTTP API on `workers/core` |
| [checkout-contract.md](./checkout-contract.md) | Interface between Pages and Worker B (no secrets) |
| [ai-playbook.md](./ai-playbook.md) | Human + AI agent workflow (Planner → Builder → Reviewer → QA) |
| [staging-checklist.md](./staging-checklist.md) | Staging deploy recipe (D1, CORS, mock unlock, Stripe test) |
| [contributing.md](./contributing.md) | PR and commit conventions |
| [versioning.md](./versioning.md) | Changesets, Version Packages PR, GitHub Releases from tags (no npm publish) |
| [security.md](./security.md) | Identity model, audit status, secret handling |

## Related repositories

- **Worker B (billing):** [`itineraryedge-billing`](https://github.com/lazehang/itineraryedge-billing) — private; Stripe Checkout and webhooks live there, not in this repo.

## Disclaimer

PDFs and schedules from ItineraryEdge are **supporting travel packets only**. They are **not** visas, consular decisions, or guarantees of admission.
