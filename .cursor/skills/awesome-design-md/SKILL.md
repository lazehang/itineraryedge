---
name: awesome-design-md
description: >-
  Selects and applies a vendored brand DESIGN.md from awesome-design-md when
  designing or restyling UI. Use for visual direction, design-system borrowing,
  “make it look like X”, or when taste-skill / web redesign needs a concrete
  token and composition reference. Do not invent a look from scratch if a close
  DESIGN.md already exists in this skill’s design-md/ library.
---

# Awesome DESIGN.md

Vendored from [VoltAgent/awesome-design-md](https://github.com/voltagent/awesome-design-md). Each brand folder under [`design-md/`](./design-md/) has a `DESIGN.md` agents can read for colors, type, layout, and component rules.

## When to use

- User asks for a redesign, restyle, or “look like [brand/product]”
- Landing / marketing / product UI needs a coherent visual system
- Pair with [`taste-skill`](../taste-skill/SKILL.md) (art direction + browser inspect) and [`web-ui`](../web-ui/SKILL.md) (ItineraryEdge app paths)

## When not to use

- Pure bugfix with no visual change
- Copying a brand wholesale onto production without human OK (esp. trademark-heavy marks)
- Overriding ItineraryEdge trust/visa constraints (honest disclaimers, no “official consular” claims)

## Workflow

1. **Read the brief** — audience, product job, existing tokens in `apps/web`.
2. **Pick 1–2 DESIGN.md refs** from `design-md/` (see recommendations below). Read the chosen `DESIGN.md` fully.
3. **Adapt, don’t clone** — extract tokens, type scale, spacing rhythm, and composition rules. Keep ItineraryEdge product copy, flows, and security/env rules.
4. **Optional project root** — if the human wants a sticky system, copy the chosen file to repo-root `DESIGN.md` (or ask first). Prefer adapting into a project-specific `DESIGN.md` rather than naming a third-party brand in shipping UI.
5. **Build in `apps/web`** via `web-ui` / `implement-slice`. For award-level art direction + screenshot QA, also run `taste-skill`.

## ItineraryEdge-oriented picks

Visa-trust + modern AI SaaS (calm, legible, not purple-glow slop):

| Need | Start here |
| --- | --- |
| Calm product SaaS / app chrome | `design-md/linear.app/DESIGN.md`, `design-md/cal/DESIGN.md` |
| Fintech / trust / paperwork | `design-md/mercury/DESIGN.md`, `design-md/ibm/DESIGN.md` |
| Clean AI product marketing | `design-md/claude/DESIGN.md`, `design-md/notion/DESIGN.md` |
| Dense developer marketing | `design-md/vercel/DESIGN.md`, `design-md/stripe` if present |

Browse others under [`design-md/`](./design-md/) when the brief names a specific brand.

## Rules

- Cite which `DESIGN.md` path you used in the hand-off.
- Do not claim the UI is affiliated with that brand.
- Respect existing ItineraryEdge non-negotiables (mock unlock flags, no Stripe in this repo, email-as-identity MVP).
- Prefer one primary reference per slice; a second only for contrast (e.g. marketing vs app screen).
