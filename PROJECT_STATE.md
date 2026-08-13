# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-13

## Current production authority

Application version: v1.2.0 — Installable Offline App
Production runtime asset revision: `1.2.0-r1`
Technical status: merged, deployed, exact-byte verified and production-proven
Runtime merge SHA: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`
GitHub Pages deployment: `5891182853`
Pages run: `31716786499`
Stability run: `31716787806`
Deployed-site-smoke job: `94503946791`
Release Integration Burn-In: `31716787876` — 2/2 complete stateful journeys passed

This is technical production proof. Owner visual acceptance remains separate and is not fabricated by automated QA.

## Active owner-authorized hotfix candidate

Application version remains v1.2.0.
Candidate runtime asset revision: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Branch: `agent/ios-loading-settings-install-fix`
PR: #38
Status: RELEASE CANDIDATE until protected PR validation, merge, GitHub Pages deployment and deployed proof complete.

The r2 hotfix fixes two owner-reported regressions only:

1. iOS standalone loading composition. Safe-area/viewport growth is separated from the Reus visual composition. The mobile portrait has a bounded width-owned top band and stable subject-safe image box instead of inheriting extra installed-app viewport height.
2. Install UI hierarchy. The floating global install/status rail and panel are removed from every screen. Service Worker, cache verification, connectivity, update activation and rollback remain in the offline controller; install/update actions live only inside lazy Settings.

Dedicated regression evidence covers desktop, low-height desktop, narrow mobile browser and iOS standalone-height loading archetypes plus Settings-only install presentation. Do not call r2 production-proven before deployed evidence exists.

Authority when sources disagree:

1. current verified source on `main` for production truth;
2. explicit later owner decisions;
3. current hotfix source when evaluating PR #38;
4. `PROJECT_STATE.md`;
5. `NEXT_TASK.md`;
6. current release and maintenance handoff;
7. roadmap/amendments;
8. older historical documents/conversations.

Never revert verified source to satisfy stale prose. Correct or relabel the document.

## Protected product rules

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league and different permanent clubs;
- maximum Season score 11;
- equal non-zero scores remain a Draw;
- only 0–0 uses league position then league points;
- League and Club confirmation checkpoints remain mandatory;
- Transfer Challenge and Season Review state machines remain authoritative;
- Statistics, Legacy and Trophy calculations remain authoritative;
- protected Marco Reus and accepted football-photo presentation remain unchanged outside the bounded loading-layout correction.

Scoring remains Champions League +5, domestic League +3, main domestic Cup +1, one shared +1 for 100 League Points/Goals, and one shared +1 for Top Scorer/Top Assist.

## Data and navigation authority

Exactly three canonical localStorage keys remain legal:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`js/storage.js` remains sole persistence/destructive mutation authority. `js/storageTransaction.js` remains the raw transaction engine. Cache Storage contains application bytes only and is never user-data authority.

`js/screens.js` remains sole route/history/Smart Back authority.

Candidate A remains non-mutating export. Candidate B remains strictly read-only analysis. Candidate C remains the only import stage allowed to commit canonical state and preserves immutable confirmed intent, strict exact raw snapshot, last-moment prewrite checks, complete in-memory planning, transaction-owned mutation/rollback, anti-clobber semantics, post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery on uncertainty.

## Installable Offline App authority

- production shell remains `1.2.0-r1` until r2 promotion;
- r2 owns a separate whole-runtime cache identity and names r1 as previous known-good runtime;
- complete verified cache population before a worker becomes viable;
- no automatic install-time activation;
- explicit Update Ready activation only at a safe Home / Showdown Home boundary;
- Candidate C transaction/recovery busy-state protection;
- whole-runtime cache selection, never per-file revision mixing;
- current/previous known-good cache verification and corruption recovery;
- cleanup restricted to this application's cache namespaces;
- unrelated caches preserved;
- worker-owned uncached connectivity verification rather than `navigator.onLine` alone;
- external YouTube media degrades explicitly while the local tracker remains usable;
- PWA controller remains lazy to preserve startup budgets;
- install presentation is Settings-owned and may not reappear as a floating/sticky global component.

## CI / testing authority

There remain 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs exercise 13 families because Release Integration Burn-In is main/manual release-only.

Sensitive visual release archetypes now explicitly include desktop, narrow mobile browser, iOS standalone installed-app height, and low-height windowed view. Loading composition tests validate relationships, not mere element existence.

Specialists own specialist evidence once. Candidate B owns one import browser proof, Candidate C one restore/recovery proof, local Stability provenance + offline lifecycle + complete journey, deployed Stability the exhaustive public boundary, and Release Integration Burn-In two complete stateful journeys. Do not duplicate evidence or weaken gates to obtain green CI.

## Performance locks

- eager raw code ceiling: 165,000 bytes;
- eager gzip ceiling: 37,500 bytes;
- startup Marco Reus portrait ceiling: 95,000 bytes;
- combined first-party startup ceiling: 260,000 bytes;
- normal loading minimum: 2700 ms;
- reduced-motion startup: 220 ms.

## Historical rollback evidence

v1.2.0 / `1.2.0-r1` is the immediate known-good rollback authority for the r2 hotfix and remains immutable in `RELEASE_V1.2.0.md`.

v1.1.5 / `1.1.5-r1` remains older immutable historical rollback evidence at runtime SHA `ff755a9863abc843ae9aac45178428e3a104fc65`.

## Current milestone

Immediate legal task: finish, prove, merge, deploy and production-seal the owner-authorized v1.2.0 / `1.2.0-r2` hotfix in PR #38.

After the hotfix is production-proven, return to v1.3.0 — Recovery & Device Resilience Hardening. Cloud, accounts, QR pairing, two-device transport and gameplay changes remain out of scope.
