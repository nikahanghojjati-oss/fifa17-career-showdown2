# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-13

## Current production authority

Application version: v1.2.0 — Installable Offline App
Runtime asset revision: `1.2.0-r1`
Technical status: merged, deployed, exact-byte verified and production-proven
Runtime merge SHA: `e5acd4ae524f181242df3114b35fd2e812cd8f3b`
GitHub Pages deployment: `5891182853`
Pages run: `31716786499`
Stability run: `31716787806`
Deployed-site-smoke job: `94503946791`
Release Integration Burn-In: `31716787876` — 2/2 complete stateful journeys passed

This is technical production proof. Owner visual acceptance remains separate and is not fabricated by automated QA.

Authority when sources disagree:

1. current verified source on `main`;
2. explicit later owner decisions;
3. `PROJECT_STATE.md`;
4. `NEXT_TASK.md`;
5. current release and maintenance handoff;
6. roadmap/amendments;
7. older historical documents/conversations.

Never revert verified source to satisfy stale prose. Correct or relabel the document.

## v1.2.0 proof

The frozen release candidate passed all 13 normal PR workflow families together before merge. Main then deployed the same runtime revision to GitHub Pages. Deployed Stability verified every runtime byte, runtime-error provenance, Home visuals, crop-safe football photographs, Candidate A, Candidate B, Candidate C, install/offline behavior and the complete public journey. Release Integration Burn-In passed both complete stateful journeys.

The frozen candidate measured 164,563 eager raw bytes / 37,355 eager gzip bytes, inside the protected 165,000 / 37,500 limits.

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
- protected Marco Reus and accepted football-photo presentation remain unchanged.

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

- application shell owned by `1.2.0-r1`;
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
- PWA UI/controller remain lazy to preserve startup budgets.

## CI / testing authority

There remain 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs exercise 13 families because Release Integration Burn-In is main/manual release-only.

Specialists own specialist evidence once. Candidate B owns one import browser proof, Candidate C one restore/recovery proof, local Stability provenance + offline lifecycle + complete journey, deployed Stability the exhaustive public boundary, and Release Integration Burn-In two complete stateful journeys. Markdown-only seals skip heavy browser lanes. Do not duplicate evidence or weaken gates to obtain green CI.

## Performance locks

- eager raw code ceiling: 165,000 bytes;
- eager gzip ceiling: 37,500 bytes;
- startup Marco Reus portrait ceiling: 95,000 bytes;
- combined first-party startup ceiling: 260,000 bytes;
- normal loading minimum: 2700 ms;
- reduced-motion startup: 220 ms.

## Historical rollback evidence

v1.1.5 / `1.1.5-r1` remains immutable historical rollback evidence at runtime SHA `ff755a9863abc843ae9aac45178428e3a104fc65` and Pages deployment `5878930362`. It is no longer current production authority.

## Current milestone and roadmap reconciliation

v1.2.0 is technically closed after deployed proof and the production documentation seal.

Next legal substantive milestone: v1.3.0 — Recovery & Device Resilience Hardening.

The older execution-roadmap label that assigned v1.3.0 directly to Local Profiles and Save Library predates the later v1.2 maintenance handoff and is stale as a current-task label. Local Profiles / Save Library remains planned future work, but its version assignment must be explicitly reconciled after v1.3 hardening rather than silently implemented under the stale label.

Cloud, accounts, QR pairing, two-device transport and gameplay changes remain out of scope for v1.3 hardening.
