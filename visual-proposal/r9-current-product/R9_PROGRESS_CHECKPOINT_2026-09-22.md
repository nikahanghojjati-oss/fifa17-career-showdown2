# R9 Current-Product Rebuild Checkpoint — 2026-09-22

Latest verified production authority:

- main: `47cbfbaba083e1eb35c06d687cceceb799e34920`
- runtime: `1.9.1-r44`
- global R9 branch: `visual/r9-r44-global-screen-realignment`
- Transfer branch: `visual/r9-transfer-presentation-slice-1`
- Transfer draft PR: #298
- global R9 draft PR: #299

## Current status by slice

| Slice | Surface | Status |
| --- | --- | --- |
| 0 | full r44 route/surface inventory | COMPLETE |
| 1 | Home + Online Identity + Daniel/Nik Pair + Create Showdown | IMPLEMENTED ON R9 BRANCH |
| 2 | League Wheel + Club Assignment Shared Setup | IMPLEMENTED ON R9 BRANCH |
| 3 | Shared Dashboard + global reconnect | IMPLEMENTED ON R9 BRANCH |
| 4 | Shared Transfer | IMPLEMENTED SEPARATELY IN DRAFT PR #298; NOT MIXED INTO GLOBAL BRANCH |
| 5 | Shared Season Results authority stack | SOURCE CONTRACT COMPLETE; VISUAL IMPLEMENTATION GATED ON INTEGRATED EVIDENCE |
| 6 | Season Summary role | NOT STARTED |
| 7 | Rivalry/Career Statistics + Trophy Room | NOT STARTED |
| 8 | Legacy + Restore/Recovery | NOT STARTED |
| 9 | Rule Book + Settings | NOT STARTED |
| 10 | global overlays/final cross-screen physical acceptance | NOT STARTED |

## Current rebuild decision

Every routed screen must be revalidated against current r44 before visual implementation.

Not every screen requires a ground-up redesign.

Current severity:

- full current-contract rebuild: Home, Create Showdown, League, Club, Season Results, Legacy
- high-impact realignment: Dashboard, Transfer, Season Summary
- moderate realignment: Rivalry Statistics, Career Statistics, Trophy Room, Rule Book
- new/current first-class cross-screen surfaces: Settings, Online Identity, Shared Setup/Career Start, reconnect/reconciliation

## What has not changed

- production `main`
- Firebase Rules/provider authority
- billing policy
- service-worker runtime revision
- scoring authority
- Daniel/Nik role mapping
- active licensed football-photo archive
- image generation lock

## Validation state

Source-level validation completed on implemented R9 slices:

- modified JavaScript/contract files parse
- current global R9 branch remained 0 behind main at last reconciliation
- provider/state ownership invariants remain present
- protected Reus geometry not overridden by R9 Home color layer
- hidden Daniel/Nik manager inputs are not resurrected
- no second Shared Setup season picker is exposed
- Shared Setup polling/click coalescing/witness/reveal/Career Start ownership remains
- Shared Dashboard scores remain provider projections
- Shared Transfer primary Dashboard action remains the real `#seasonPrimaryAction`
- reconnect remains the real global provider-derived surface

Full repository Node/Playwright execution has not been claimed because this execution environment cannot clone GitHub and the current workflows are main-push/manual-dispatch oriented.

## Next implementation gate

Before styling Season Results, create/extend integrated browser evidence for the visible authority stack, especially:

- 1366×768 Chromebook geometry
- final reconciliation
- Terminal Close READY / BLOCKED / RECOVERY_PENDING / CLOSED

Then begin Season Results visual implementation against the exact runtime-created panels.
