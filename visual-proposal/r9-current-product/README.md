# R9 Current-Product Visual Realignment

Status: ACTIVE ALIGNMENT
Base: `47cbfbaba083e1eb35c06d687cceceb799e34920`
Runtime: `1.9.1-r44`
Branch: `visual/r9-r44-global-screen-realignment`

This package replaces the assumption that the old R8 proposal branch can be ported directly into current production.

The old R8 proposal remains a visual reference library only. Current `main` is the product/runtime authority.

## Non-negotiable product locks

- Manager 1 / Player One = Daniel
- Manager 2 / Player Two = Nik
- online-only Shared Showdown product
- Firebase Spark only
- billing OFF
- no Cloud Run / Cloud Functions dependency
- preserve provider/runtime authority
- no second router, second save engine, second transfer engine, second scoring engine, or visual-only duplicate controls
- live DOM controls remain the implementation surface
- image generation remains locked until the current DOM/state contract for a slice is stable

## Why R9 needs a full-product re-alignment

Current r44 has 13 routed screens, but visual ownership is now broader than those route shells. Runtime code injects or mutates important product surfaces on Create Showdown, League Wheel, Club Assignment, Dashboard, Transfer Challenge, Season Results, Legacy, Settings and global navigation.

The high-risk additions since the older visual proposal include:

- fixed online Daniel/Nik identity and sign-in gate
- persistent pair state
- Shared Showdown provider-owned league/club presentation
- authoritative season-plan recovery/locking
- Shared Career Start
- Shared Transfer replay and private-state routing
- Shared Season Results review/publish flow
- Shared Season Commit
- Canonical Scoring
- History Convergence
- Multi-Season Progression
- Journey Reconnect
- Journey Conflict / Local / Final Reconciliation
- Terminal Close
- connected-account Settings presentation
- Restore/Recovery surfaces

Therefore every old R8 screen document must be rechecked before implementation. Some can preserve visual direction; none should be treated as current DOM/state authority.

## Working documents

- `R44_SCREEN_SURFACE_ALIGNMENT_MATRIX.md` — current route/surface ownership and rebuild severity
- `R9_IMPLEMENTATION_SEQUENCE.md` — safe implementation order and acceptance gates

## Parallel Transfer work

Draft PR #298 (`visual/r9-transfer-presentation-slice-1`) is a separate bounded Transfer implementation from the same r44 base. Do not mix unrelated global-screen changes into that PR. Transfer work should be reconciled into the global R9 line only after its own acceptance gate.

## Current checkpoint

Global R9 is in source-backed realignment. No broad production visual replacement has been authorized by this document alone.
