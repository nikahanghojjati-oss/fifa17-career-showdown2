# Career Mode Showdown v1.4.0 — Product Deepening

Status: PRODUCTION PROVEN (authority/version seal)
Application version: `v1.4.0`
Runtime asset revision: `1.4.0-r1`
Previous known-good runtime: `1.3.0-r2`
Release tag: `v1.4.0`
Release date: 2026-08-17 ET
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Release purpose

v1.4.0 is the formal application milestone for the Product Deepening first slices already shipped on production:

1. **Phase B / Save Library Experience 2.0 first slice** (PR #70, merge `65b6c9db0a070b6e5e992a39dffeee23df0c6f08`) — richer Save Library cards, clearer Local Profile presentation, local sorting, 44px touch-target polish.
2. **Phase C / Showdown Home & Season Experience first slice** (PR #73, merge `dec1d3ba8182c3f62019974dd1704c7c9124def6`) — series lead/trail status chip on Home, contextual primary action (`VIEW COMPLETED SHOWDOWN`), last completed season summary, Phase C Home styles injected from `js/showdownUI.js` to preserve eager CSS ceilings.

This seal restores **visible public version progression**. Feature progress advances the formal application version and installed runtime shell shown in the site footer and `app-asset-revision` meta — not only internal PR numbers.

## Shipped product deepening (presentation-only)

- Save Library richer cards and Local Profile presentation (Phase B first slice).
- Local sort affordances on the Save Library surface.
- Showdown Home series status chip (lead / trail / level).
- Contextual Home primary action label reflecting the real next step.
- Last completed season result summary on Home when at least one season has been played.
- Touch-target polish (min-height 44px) on primary Home / library actions.
- Phase C styles injected from `js/showdownUI.js` so eager CSS performance ceilings remain intact.

No new canonical storage keys. No mutation of Save Library / profile / season identity semantics. No scoring rule changes. Multi-Save formatVersion 2 portability, Candidate A/B/C, identity-safe Analytics, and performance ceilings remain preserved.

## Protected architecture

`js/screens.js` remains navigation/history/Smart Back authority. `js/storage.js` remains public raw browser-storage authority. `js/storageTransaction.js` remains the raw transaction engine. `js/saveLibraryRuntime.js` remains Save Library product mutation authority. `js/analytics.js` remains Analytics calculation authority. UI code does not own canonical `localStorage`.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the only destructive import Apply stage with strict exact raw snapshot authority, transaction-owned rollback, anti-clobber ownership and byte-for-byte verification.

Gameplay model unchanged: exactly two managers; Showdown lengths 1/3/5/10; same selected league; different permanent clubs; maximum Season score 11; equal non-zero scores Draw; only 0–0 uses league-position then league-points tiebreakers.

## Whole-shell relationship

Production shell: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`

The r1 whole-shell identity is required so changed runtime JavaScript, CSS query params, manifest icons, footer and Service Worker cache key update installed clients atomically. `1.3.0-r2` remains the exact immediate previous whole-shell recovery target.

## Permanent product locks

Private two-manager companion only. Public community features and global leaderboard/rankings are **ELIMINATED**. Private remote joining remains an important future requirement but is currently **BLOCKED** until the dependency order (Cloud Readiness → Private Account/Identity → Paired Device → Remote Joining) is ready.

## Authority after this seal

`NEXT_TASK.md` and `PROJECT_STATE.md` mark Phase B first slice and Phase C first slice closed / production-proven. **No product candidate is currently authorized.** Hold clean stop until a further explicit owner instruction.
