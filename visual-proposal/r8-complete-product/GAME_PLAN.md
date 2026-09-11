# Showdown Visual Game Plan

Status: ACTIVE VISUAL-PROPOSAL TRACK / PROPOSAL ONLY / NOT PRODUCTION

## Purpose

Game Plan is the lightweight progress scoreboard for the Showdown visual environment only. It does not replace the main project's operating system.

`100 / 100` means a complete, browser-rendered, responsive visual proposal has reached the owner for full review. It does **not** mean production `main` has been modified or approved for implementation.

## Permanent safety boundary

- Production `main` remains untouched by proposal work.
- Firebase Spark only; Billing remains OFF permanently; no paid fallback.
- No proposal visual effect may add Firestore/Firebase writes merely to render presentation.
- No public discovery, community or ranking surface.
- Manager 1 = Daniel; Manager 2 = Nik.
- Core save, scoring, reveal, Shared Journey and persistence semantics remain authoritative.
- The proposal may replace presentation architecture, but not silently fork product/domain authority.
- Real UI is HTML/CSS/JS/SVG. Generative image work is limited to bounded source-art tickets such as character or environment artwork.
- No merge or production swap occurs before owner review and later CM reconciliation.

## CM alignment contract

The visual track owns presentation proposal work. CM owns the production architecture/main-line reconciliation later.

Every substantial proposal screen records integration notes as it is built: represented states, actions, data dependencies/ownership, persistence/network boundaries, accessibility semantics, responsive/motion behavior and explicitly decorative layers.

Reconcile against then-current production contracts per screen. Do not assume a screen contract remains current merely because it was correct at the start of R8.

Current production reconciliation anchor: `35843a13fd1ecfa3e8f1c91ef4c09a06584ba029` / `1.9.1-r18`. The r18 advance adds Terminal Close and deployment-guard work; the Home, League Wheel and Club Assignment DOM roles used by the current visual trio remain present.

## Current owner visual-reference authority

The owner-supplied cinematic reference family is classified `REFERENCE_ONLY / OWNER VISUAL-LANGUAGE APPROVED`.

They are authoritative for visual ambition and design language, not for product truth. Text, scores, controls, club/league marks, feature availability and manager placement must be reconciled against the live product before implementation.

Detailed synthesis: `evidence/VISUAL_LANGUAGE_REFERENCE_SYNTHESIS_R8_32_2026-09-10.md`.

R8.33 adds an explicit **practical-replica requirement**: when an owner reference is visually approved, build toward its composition, density, scale and object language as closely as practical instead of reducing the target to a generic black/gold card system. Correct reference mistakes and product mismatches without lowering the visual ambition.

Shared visual grammar now locked:

- full-bleed warm stadium atmosphere with near-black foreground surfaces;
- slanted CM17 black/gold application shell with recurring original crown motif;
- bold brush-like gold page/brand lettering paired with condensed uppercase functional typography;
- Daniel left / Nik right desktop rivalry framing with page-specific pose/expression intent;
- central task-specific hero object or information surface, not one universal card layout;
- physical/object-rich UI motifs inside real buttons/cards;
- black metallic inactive controls and warm-gold selected/focus states;
- thin gold edge lighting, restrained glow and strong white/gold contrast;
- clear depth separation: atmosphere -> characters -> live product UI;
- large decisive primary CTA plus quieter secondary/back actions;
- cinematic desktop composition that deliberately recomposes at tablet/mobile breakpoints;
- consistent brand language while allowing different page compositions for Home, Create, League, Club Assignment, Pairing, Statistics, Settings, Legacy, Trophy and season-result surfaces.

## Character / live-object contact policy

Visual contact is permitted when it remains presentation-only and cannot become product authority.

For a wheel, an isolated character hand may visually approach or meet a stable decorative outer rim while the real rotating/selectable wheel remains DOM-owned. The character layer must not intercept pointer events or determine selection. If stable contact cannot survive browser geometry, use an air gap.

For a pack/reveal object, contact is acceptable only against a stable exterior frame/rail/pedestal or another frozen geometry surface. Do not make a raster hand the hit target, state clock, club-result source or required readable layer. If responsive/reveal motion makes contact brittle, use an air gap instead.

## Workstreams

| Workstream | Weight | Credit | Completion condition |
| --- | ---: | ---: | --- |
| Architecture + reference extraction | 15 | 15 | product boundaries, page inventory and visual language mapped |
| Shared cinematic shell / navigation / design system | 15 | 8 | reusable responsive shell and primitives browser-proven |
| Club Assignment cinematic rebuild | 15 | 10 | new live theatre, result deck and character integration browser-proven |
| Remaining core-screen rebuild | 25 | 4 | required product screens assembled in the new system |
| Daniel/Nik + environmental source assets | 10 | 4 | accepted reusable expression/pose masters integrated |
| Deterministic Club Identity system | 8 | 4 | real catalog validated, rendered and owner-reviewed |
| Responsive/accessibility/motion/SFX/browser QA | 7 | 6 | target viewport/state matrices pass |
| Final owner-review package | 5 | 0 | complete proposal rendered and presented together |
| **TOTAL** | **100** | **51** | |

## Active build phase

`GAME PLAN 51 / 100`

R8.33 now has a three-screen **reference-faithful owner-review set**: Home, Select League and Club Assignment. These are real browser consumers rather than generated webpage pictures.

### Home

Current consumer:

- `prototypes/01b-home-cinematic-reference-faithful-r8-33.html`
- `prototypes/r8-33-home-reference-faithful.css`
- proof: `evidence/HOME_REFERENCE_FAITHFUL_R8_33_BROWSER_PROOF_2026-09-10.md`

Home reproduces the owner reference's large A02/A01 manager staging, CM17 crown/nav identity, object-rich six-button dock, selected-gold treatment, soundtrack card and stadium composition as real HTML/CSS/SVG. Two Home modes across six viewport conditions passed: **12/12**.

### League Wheel

Current consumer:

- `prototypes/03b-league-wheel-cinematic-reference-faithful-r8-33.html`
- `prototypes/r8-33-league-wheel-reference-faithful.css`
- proof: `evidence/LEAGUE_WHEEL_REFERENCE_FAITHFUL_R8_33_BROWSER_PROOF_2026-09-10.md`

League Wheel uses a real five-segment DOM/CSS wheel, original non-official league glyphs, stable crown hub/rim, large A02/A01 manager staging on wide desktop, reference-like title/quote/action hierarchy and production-aligned state text. Six states across six viewport conditions passed: **36/36**. An initial wheel/control collision detected at short desktop was corrected before proof was accepted.

### Club Assignment

Current reference-faithful consumer:

- `prototypes/04e-club-assignment-reference-faithful-r8-33.html`
- proof: `evidence/CLUB_ASSIGNMENT_REFERENCE_FAITHFUL_R8_33_BROWSER_PROOF_2026-09-11.md`

R8.33 brings the real-browser presentation toward the owner's two-manager pack theatre: large Daniel/Nik framing, 01–05 progress rail, two DOM-owned pack surfaces, central rivalry VS, lower permanent-club lock deck and gold Open/Confirm hierarchy. The four-view responsive geometry matrix passes with no horizontal overflow and no pack/action overlap.

The existing production reveal authority remains the six-state sequence proven by predecessor consumers. The current visual limitation is explicit: the reusable Daniel/Nik masters reproduce scale, placement and lighting but do not yet literally grip the DOM packs. If the owner requires that exact contact after review, it becomes a bounded isolated character-source ticket, not a full-screen generation task.

## Current operation

**Owner review of the R8.33 Home / Select League / Club Assignment replica trio.** Incorporate bounded corrections without lowering the reference-fidelity target, then build Create Showdown as the next reference-faithful consumer.

In parallel, the two remaining cross-screen fidelity gaps remain bounded refinements rather than reasons to flatten the UI:

1. improve the original stadium/environment source layer beyond the current procedural CSS without baking UI/characters into it;
2. improve the fixed CM17/hero brush-letter treatment with an original zero-dollar/offline-safe asset or vector treatment while keeping live changing labels as DOM text.

Final character and environment generation remains ticketed/isolated. Do not generate whole webpage screenshots as implementation.

## Lightweight reporting contract

Substantive visual-project updates report only:

`Game Plan: N/100 | Current operation: ... | Production main: unchanged/explicit status | Handoff proximity: ...`

Game Plan credit increases only for completed/proven work, not for discussion volume or attractive concept images.
