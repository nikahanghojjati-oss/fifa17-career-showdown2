# Career Mode Showdown — Project State

Last updated: 2026-08-13

Application candidate: v1.3.0
Runtime asset revision: `1.3.0-r1`
Release state: Recovery & Device Resilience Hardening release candidate; not yet production-proven
Last production-proven application: v1.2.0 Installable Offline App / `1.2.0-r1`
Immutable v1.2 runtime merge authority: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`
Proven v1.2 Pages deployment: `5891182853`

## Current objective

Close v1.3.0 as a maintenance-first resilience release. Do not begin Local Profiles, cloud, accounts, QR pairing, two-device transport, gameplay changes or a framework rewrite before the frozen `1.3.0-r1` candidate is merged and public GitHub Pages proof passes.

## Evidence-backed v1.3 hardening

The functional prototype passed all 13 normal PR workflow families together before identity freeze. It fixes:

- Candidate A blocked canonical reads by using the strict exact raw snapshot authority and failing closed before backup creation;
- repeated offline renders corrupting the saved pre-offline YouTube status;
- a `controllerchange` race by arming update intent before worker activation;
- redundant same-scope Service Worker registration;
- unversioned shell requests colliding with an empty previous-revision sentinel;
- version-fragile cloud and release authority contracts;
- v1.3 Service Worker recovery semantics with `1.2.0-r1` retained as previous known-good shell;
- explicit rollback pinning by making manual previous-runtime selection recovery-oriented rather than permanent;
- misleading activation acceptance by requiring successful `skipWaiting()` first;
- dependency-lock transcription drift by rebuilding release metadata from the proven lock graph rather than hand-editing integrity hashes.

## Protected product rules

v1.3.0 changes no gameplay rule:

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league and different permanent clubs;
- maximum Season score 11;
- equal non-zero scores remain Draw;
- only 0-0 uses league position then league points;
- League and Club confirmation checkpoints remain mandatory;
- Transfer Challenge and Season Review state machines remain authoritative.

Scoring remains Champions League +5, domestic League +3, main domestic Cup +1, one shared +1 for 100 League Points/Goals and one shared +1 for Top Scorer/Top Assist.

## Data-safety authority

Exactly three canonical localStorage keys remain legal:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`js/storage.js` remains sole canonical persistence/destructive mutation authority. `js/storageTransaction.js` remains its raw transaction engine. Cache Storage contains application bytes only.

Candidate A remains non-mutating export. Candidate B remains strictly read-only analysis. Candidate C remains the only import stage allowed to commit canonical state and preserves immutable confirmed intent, strict exact raw snapshot authority, last-moment prewrite checks, complete in-memory planning, transaction-owned rollback, anti-clobber ownership, post-write verification, byte-for-byte rollback verification and critical recovery on uncertainty.

## Navigation and presentation authority

`js/screens.js` remains sole route/history/Smart Back authority. Lazy screens may share semantic back markers but may not create a second navigation listener or state machine.

Protected Marco Reus Home/loading presentation and the accepted route-scoped football-photo archive remain unchanged. Owner visual acceptance remains distinct from automated decode/license/crop proof.

## Installable Offline App authority

v1.2.0 Installable Offline App is the proven local/offline baseline. v1.3 keeps its architecture: atomic cache population, no automatic install-time activation, explicit safe-boundary Update Ready flow, whole-runtime cache selection, previous-known-good recovery, worker-owned reachability verification, unrelated-cache preservation and local-data independence from Cache Storage.

The frozen v1.3 Service Worker uses `1.3.0-r1` as current and `1.2.0-r1` as previous known-good runtime.

## CI and performance locks

There remain 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs exercise 13 families because Release Integration Burn-In is main/manual release-only.

Candidate B owns one import-analysis browser proof. Candidate C owns one restore/recovery browser proof. Local Stability owns provenance, offline/cache lifecycle and one complete journey. Deployed Stability owns exact bytes, provenance, Home, visuals, Candidate A/B/C, install/offline and the complete public journey. Burn-In repeats only the complete stateful journey twice.

Do not duplicate evidence or weaken assertions to obtain green CI.

Protected startup ceilings remain:

- eager raw code: 165,000 bytes;
- eager gzip: 37,500 bytes;
- Reus portrait: 95,000 bytes;
- combined first-party startup: 260,000 bytes;
- normal loading minimum: 2700 ms;
- reduced-motion loading: 220 ms.

The pre-freeze v1.3 prototype inherited the proven 164,563 raw / 37,355 gzip eager footprint. The frozen candidate must re-prove the ceilings.

## Roadmap authority

The later current-facing decision supersedes the older numeric assignment of v1.3 directly to Local Profiles. v1.3.0 is Recovery & Device Resilience Hardening. Local Profiles and Save Library remains future approved work with its new version assignment pending explicit reconciliation after v1.3 closes.

Cloud remains future-only. `CLOUD_STORAGE_FOUNDATION.md` preserves identity, compare-and-swap revisions, conflicts, tombstones, privacy/security and the rule that no future cloud module may call localStorage directly.

## Release exit criteria

1. page, package, package lock, manifest, worker, dynamic asset queries and release docs agree on v1.3.0 / `1.3.0-r1`;
2. `1.2.0-r1` remains valid previous-known-good shell;
3. all 13 normal PR workflow families pass together on the frozen candidate;
4. merge through the normal protected PR path;
5. GitHub Pages serves exact frozen runtime bytes;
6. deployed Stability passes exact bytes, provenance, Home, visuals, Candidate A/B/C, install/offline and complete journey;
7. Release Integration Burn-In passes 2/2;
8. only after deployed proof promote README, CHANGELOG and release authority from v1.2.0 to v1.3.0.
