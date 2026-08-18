# Career Mode Showdown Changelog

Last updated: 2026-08-17 ET

## v1.4.0 — Product Deepening — production

Current production runtime: `1.4.0-r1`
Previous known-good runtime: `1.3.0-r2`
Status: merged product slices + formal version seal; visible on public site footer.

Formal application milestone for:

- Phase B / Save Library Experience 2.0 first slice (PR #70) — richer cards, clearer Local Profiles, local sort, 44px touch targets.
- Phase C / Showdown Home & Season Experience first slice (PR #73) — series lead/trail chip, contextual primary action (`VIEW COMPLETED SHOWDOWN`), last completed season summary, styles injected from `js/showdownUI.js`.

Restores visible public version progression (footer + `app-asset-revision` + Service Worker shell). Does not change scoring, canonical storage keys, multi-Save portability, or identity semantics.

## v1.3.0 — Recovery & Device Resilience Hardening — production

Runtime progression: `1.3.0-r1` → `1.3.0-r2` (Local Profile display-label editing whole shell).

Includes formatVersion 2 multi-Save portability (PR #67), identity-safe Analytics, Local Profile display labels, and resilience hardening.

## Earlier releases

See historical `RELEASE_V*.md` records for v1.2.0 and earlier. Public community / global leaderboard features remain permanently ELIMINATED. Private remote joining remains BLOCKED until dependency order is ready.
