# Career Mode Showdown v1.3.0 Release Record

Release date: pending production proof
Release tag: `v1.3.0`
Runtime asset revision: `1.3.0-r1`
Status: RELEASE CANDIDATE

## Purpose

v1.3.0 is a maintenance-first Recovery & Device Resilience Hardening release built from the technically production-proven v1.2.0 / `1.2.0-r1` baseline. It does not change gameplay, scoring, accepted visuals, canonical navigation ownership or the three-key local persistence model.

## Evidence-backed fixes in the candidate

- Candidate A backup now fails closed when any canonical storage read is blocked instead of exporting a checksum-valid but incomplete backup.
- Live offline-to-online recovery preserves the real pre-offline YouTube status through repeated offline renders and restores it on reconnect.
- Update activation arms page reload intent before a waiting worker can activate, closing a `controllerchange` race.
- Existing Service Worker registrations update in place rather than being redundantly re-registered on the same scope.
- Unversioned shell requests fall through to the network instead of colliding with an empty previous-revision sentinel.
- v1.3 activates `1.2.0-r1` as the explicit previous known-good shell while preserving whole-runtime revision selection.
- Manual previous-runtime rollback is designed as a recovery action rather than a permanent healthy-runtime pin.
- Worker activation acceptance must correspond to successful `skipWaiting()` execution.
- Cloud foundation and release-authority contracts are version-resilient and preserve semantic dependency order instead of hard-coding obsolete roadmap labels.
- Stale runtime-version fallbacks in lazy/eager support modules are removed during the identity freeze rather than spoofing an old revision when authority metadata is unavailable.

## Protected invariants

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league, different permanent clubs;
- maximum Season score 11 and 0-0-only tiebreak;
- League and Club confirmations;
- Transfer Challenge and Season Review state machines;
- Statistics, Legacy and Trophy calculations;
- `js/screens.js` sole navigation/history/Smart Back authority;
- exactly three canonical localStorage keys;
- `js/storage.js` sole canonical persistence/destructive authority;
- Candidate A non-mutating export;
- Candidate B strictly read-only analysis;
- Candidate C immutable confirmed intent, strict exact raw snapshot, last-moment prewrite checks, transaction-owned rollback, anti-clobber and byte-for-byte verification;
- protected Marco Reus and accepted football-photo presentation;
- startup performance ceilings;
- local-first operation;
- whole-runtime offline cache coherence.

## Previous production authority

Until this candidate is merged, deployed and proven at the public boundary, v1.2.0 / `1.2.0-r1` remains current production authority:

- runtime merge `e5acd4ae524f181242df3114b35fd2e812cd8f3b`;
- Pages deployment `5891182853`;
- Stability `31716787806` / deployed smoke `94503946791`;
- Release Integration Burn-In `31716787876`, 2/2.

## Candidate exit criteria

1. coherent `v1.3.0` / `1.3.0-r1` identity across page, package, manifest, worker, lazy loaders and release docs;
2. `1.2.0-r1` retained as previous known-good Service Worker shell;
3. all 13 normal PR workflow families green together on the frozen candidate;
4. protected eager budgets remain within 165,000 raw / 37,500 gzip bytes;
5. merge through the normal protected PR path;
6. exact deployed Pages bytes plus deployed Stability and 2/2 Burn-In pass;
7. only then promote README/CHANGELOG and production authority from v1.2.0 to v1.3.0.
