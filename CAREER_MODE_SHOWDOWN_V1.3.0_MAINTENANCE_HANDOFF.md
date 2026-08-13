# Career Mode Showdown — v1.3.0 Maintenance Handoff

Last updated: 2026-08-13 ET
Candidate: `v1.3.0` / `1.3.0-r1`
Previous known-good: `v1.2.0` / `1.2.0-r1`
Draft PR: #37

## Owner direction

Deep maintenance and bug fixing. Preserve working functions, accepted visuals, gameplay, Candidate A/B/C safety, Smart Back, canonical storage authority, performance ceilings and single-owner CI evidence. Investigate conflicting or missing information instead of weakening tests. Work does not continue after the browser/session closes, so this file is continuity evidence.

## Proven baseline

v1.2.0 is technically production-proven from runtime merge `e5acd4ae524f181242df3114b35fd2e812cd8f3b`, Pages `5891182853`, Stability `31716787806` / deployed smoke `94503946791`, and Burn-In `31716787876` 2/2.

## Protected authority

`js/screens.js` remains sole navigation/history/Smart Back owner. `js/storage.js` remains sole canonical persistence/destructive owner. `js/storageTransaction.js` remains raw transaction engine. Exactly three canonical localStorage keys remain legal. Cache Storage contains application bytes only.

Candidate A remains non-mutating export. Candidate B remains strictly read-only. Candidate C remains the only import commit path and preserves immutable confirmed intent, strict exact raw snapshot, stale-state rejection, last-moment prewrite checks, transaction-owned rollback, anti-clobber ownership and byte-for-byte verification.

Gameplay/scoring, League/Club confirmations, Transfer Challenge, Season Review, Statistics/Legacy/Trophy calculations, Marco Reus/accepted football photos and startup budgets remain protected.

## Evidence-backed v1.3 fixes

1. Candidate A blocked reads: backup could previously collapse a thrown canonical storage read into apparent absence. Export now reuses strict raw snapshot authority and fails closed with zero writes/removals. Regression blocks a Legacy read and verifies byte preservation.

2. Live reconnect media state: repeated offline renders could overwrite the saved pre-offline YouTube status with the OFFLINE override. Reconnect now restores the true original state. A VM contract executes offline → offline → online against the production function.

3. Update activation race: reload intent is armed before `CMS_ACTIVATE_UPDATE`, preventing `controllerchange` from winning before the page knows activation was requested.

4. Registration ownership: existing Service Worker registrations update in place and return instead of being redundantly registered again on the same scope.

5. Empty previous-revision sentinel: unversioned shell requests now fall through rather than matching an empty previous runtime and returning `Response.error()`.

6. Cloud/release authority drift: cloud dependency tests now protect semantic order instead of obsolete version labels. Release candidate/publication validation is being made version-resilient before the v1.3 identity freeze.

## Prototype proof

At functional prototype head `da2e94c581fbd656f253b490c2765a2cdd5a1105`, all 13 normal PR workflow families passed together. Static logs explicitly passed Candidate A blocked-read safety, semantic cloud ordering, v1.3 activation/registration/reconnect contracts, Service Worker fallthrough, executable reconnect restoration and the protected 13-workflow / 27-block topology.

Prototype eager budget remained 164,563 raw / 37,355 gzip bytes.

## Freeze rules

Freeze coherently to `v1.3.0 / 1.3.0-r1`; set `1.2.0-r1` as previous known-good Service Worker runtime; never hand-edit dependency integrity hashes; remove stale fallback identities such as `1.1.4-r1`; keep README/CHANGELOG on v1.2 production while the v1.3 release record says RELEASE CANDIDATE; promote production docs only after deployed proof.

Manual previous-runtime rollback must be recovery-oriented, not an indefinite pin to healthy old code. Worker activation acceptance must correspond to successful `skipWaiting()`.

## CI topology

Keep 14 permanent workflow families and 27 protected executable blocks. Normal PRs run 13. Candidate B owns one analysis browser proof, Candidate C one restore/recovery proof, local Stability provenance + offline lifecycle + complete journey, deployed Stability the exhaustive public boundary, and Burn-In two complete journeys on main/manual release use.
