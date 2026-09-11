# R8.32 Cinematic Shell Browser Proof

Status: `ASSEMBLED_PROPOSAL / BROWSER-PROVEN FOUNDATION / OWNER FINAL VISUAL REVIEW OPEN`

Production `main` anchor: `e624d19e04c0ca56f33fa7f0d25fdcc42eb99eda`

Proposal artifact: `prototypes/00-cinematic-shell-r8-32.html`

## Purpose

This is the first real shared-shell implementation for the elevated cinematic proposal. It is not a full product screen and it is not production integration.

The artifact establishes reusable presentation primitives before final character/background art:

- persistent CM17 black/gold application header;
- product-truth-oriented primary navigation labels rather than copying invented prototype routes;
- atmospheric stadium/depth plane implemented with CSS only for this proof;
- page kicker, display-title and rivalry-tagline hierarchy;
- noninteractive Daniel/Nik exterior art slots;
- near-black live content panel, primary/secondary route tiles and status treatment;
- compact branded footer;
- desktop/tablet/mobile responsive breakpoints;
- reduced-motion-safe presentation;
- explicit `data-backend-authority="none"` proposal boundary.

No Firebase, persistence, save, Shared Journey, network or club-draw operation exists in this shell harness.

## Browser matrix

Validated locally in Chromium using the committed shell source equivalent with `page.set_content(...)`.

| Viewport | Motion | Character slots | Horizontal overflow | Result |
| --- | --- | --- | --- | --- |
| 1366x768 | normal | visible | none (`scrollWidth = 1366`) | PASS |
| 1440x900 | normal | visible | none (`scrollWidth = 1440`) | PASS |
| 940x700 | reduced | removed by responsive contract | none (`scrollWidth = 940`) | PASS |
| 390x844 DPR2 | normal | removed | none (`scrollWidth = 390`) | PASS |

The mobile composition intentionally scrolls vertically (`~948px` document height at 390x844) rather than shrinking desktop controls below useful size. This is expected responsive recomposition, not overflow failure.

## Interaction/accessibility observations

- Character slots use `pointer-events:none` and are `aria-hidden`.
- Decorative stadium/light layers are pointer-inert and hidden from semantics.
- Primary navigation is represented with real button elements and an `aria-current` active state.
- Utility icons that do not yet map to a proven product action are visibly present only as disabled proposal placeholders; the shell does not silently invent their behavior.
- Narrow viewports remove the full desktop navigation and expose a compact disabled menu placeholder pending real navigation binding.
- Focus-visible styling is explicit.
- `prefers-reduced-motion: reduce` removes any future transition/animation authority at the shell layer.

## Visual reading

The foundation successfully moves away from the current light/gray application framing toward the approved reference language: near-black shell, yellow/gold active state, large page identity, cinematic atmospheric depth and exterior manager staging.

The CSS-only stadium and character silhouettes are intentionally placeholders. They prove composition and safe zones; they are not final artwork.

## What this proof does not establish

- final Daniel/Nik character art;
- final stadium artwork;
- a functioning mobile navigation drawer;
- production route wiring;
- Club Assignment reveal-state binding;
- deterministic Club Identity final owner approval;
- production readiness.

## Next consumer

Club Assignment is the first full screen to consume this shell. It must preserve the current production reveal/save contract while replacing the inherited gray-card presentation with the cinematic pack theatre, VS hierarchy and lower locked-rivalry deck.

Before that consumer is considered complete, run the full six-state Club Assignment matrix and preserve the existing B2 safety findings as predecessor evidence.
