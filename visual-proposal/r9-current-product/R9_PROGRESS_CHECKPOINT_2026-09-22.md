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
| 5 | Shared Season Results authority stack | PRESENTATION IMPLEMENTED; INTEGRATED BROWSER/PHYSICAL EVIDENCE STILL REQUIRED |
| 6 | Season Summary role | IMPLEMENTED PRESENTATION-ONLY |
| 7 | Rivalry/Career Statistics + Trophy Room | IMPLEMENTED PRESENTATION-ONLY |
| 8 | Legacy + Restore/Recovery | IMPLEMENTED PRESENTATION-ONLY |
| 9 | Rule Book + Settings | IMPLEMENTED PRESENTATION-ONLY |
| 10 | Shared Journey/Career Start overlays + global runtime notices | IMPLEMENTED PRESENTATION-ONLY; FINAL PHYSICAL ACCEPTANCE STILL REQUIRED |

## Current rebuild decision

The owner concern that all screens might need updating was correct at the contract level.

Every routed screen has now been revalidated against current r44, and every route family has an R9 presentation path based on the latest runtime instead of the older R8 assumptions.

This does not mean every screen received a ground-up DOM rewrite. R9 deliberately reuses current live controls, panels and runtime-created nodes.

## Current implementation scope

### Entry / setup

- protected Home Reus geometry retained
- online identity gate/badge realigned
- persistent Daniel/Nik pair panel realigned
- Create Showdown realigned around fixed Daniel/Nik identity and the real 1/3/5/10 season selector
- League Wheel + Club Assignment realigned around provider-owned Shared Setup
- second season picker remains non-visual
- Shared Career Start / paired-first overlays realigned using the existing `remoteJoining` surfaces

### Shared gameplay

- Dashboard realigned around authoritative Shared Multi-Season projection
- Shared Transfer remains isolated in draft PR #298
- Season Results entry/review/commit/scoring/history/final/terminal stack realigned using the real runtime panels
- no new Season Results state machine was created
- Season Summary received presentation-only realignment without new Shared progression authority

### Archive / analytics / settings

- Rivalry Statistics
- Career Statistics
- Trophy Room
- Legacy
- Restore / Recovery
- Rule Book
- Settings / connected player account surface

all received presentation-only R9 alignment using their existing data owners.

### Cross-screen states

- Shared Journey reconnect
- Shared Journey / Career Start overlays
- global runtime notices

are aligned with the same R9 material system.

## What has not changed

- production `main`
- Firebase Rules/provider authority
- billing policy
- service-worker runtime revision
- canonical scoring rules
- Daniel/Nik role mapping
- active licensed football-photo archive
- image generation remains locked
- local/canonical storage boundaries
- Transfer PR #298 remains isolated

## Source-level validation completed

- modified JavaScript and contract files parse
- branch remains based on r44 and was 0 behind `main` at latest reconciliation
- provider/state ownership invariants remain present
- protected Reus geometry is not overridden
- hidden Daniel/Nik manager inputs are not resurrected
- no second Shared Setup season picker is exposed
- Shared Setup polling/click coalescing/witness/reveal/Career Start ownership remains
- Shared Dashboard scores remain provider projections
- Shared Transfer primary Dashboard action remains the real `#seasonPrimaryAction`
- reconnect remains the real global provider-derived surface
- Season Results opponent privacy remains intact until `RESULTS_READY`
- coordinator-only Season Commit remains intact
- both-manager acknowledgements remain intact
- canonical scoring remains provider-authoritative/read-only
- History Convergence remains read-only and visibly witnessable
- Final Reconciliation still forbids an additional season
- Terminal Close still uses exact active-session authority and same-witness retry
- Candidate C Restore behavior is unchanged

## Remaining acceptance gates

The branch is still draft.

Before merge:

1. current GitHub CI must be green,
2. full browser suite must remain green,
3. R9 integrated Season Results visual audit should cover the full visible authority stack,
4. Chromebook 1366×768 geometry must be reviewed,
5. iPhone 390×844 automated geometry must be reviewed,
6. physical iPhone Safari + Chromebook Chrome acceptance must be completed,
7. Transfer PR #298 must be independently accepted/reconciled before any final integrated visual release,
8. production release/cache revision work must happen only at final merge/release stage.

## Next safe step

Run/inspect current CI and browser evidence on draft PR #299.

If green, perform visual screenshot review at Chromebook + phone sizes, then reconcile accepted Transfer PR #298 into the final R9 product line without reintroducing old R8 runtime assumptions.
