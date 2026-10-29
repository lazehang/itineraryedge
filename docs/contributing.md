# Contributing

Thank you for improving ItineraryEdge. This repo is **work in progress** — expect API and UI churn.

## Before you open a PR

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

## Pull requests

- Target **`main`** unless maintainers direct otherwise.
- Keep changes focused; prefer docs-only PRs when documenting behavior without code changes.
- Do **not** commit Cloudflare account ids you use privately, Stripe keys, or real BYOK keys.
- Link related issues or iteration notes in the PR description when helpful.

## Commit messages

Use clear, imperative subject lines (e.g. `docs: add checkout contract`). Multi-commit PRs may group by area (`feat(core)`, `feat(web)`, `docs`).

## Co-authored-by

Project commits include:

```
Co-authored-by: lazehang <lazehang@gmail.com>
```

Add this trailer on commits you author for this repository when following maintainer workflow.

## Security-sensitive changes

Read [security.md](./security.md) before changing auth, unlock, or billing boundaries. Payment logic belongs in Worker B, not the public core.
