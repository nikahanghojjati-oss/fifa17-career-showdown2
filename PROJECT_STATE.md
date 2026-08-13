# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-13 ET

## Current production authority

Application version: v1.2.0 — Installable Offline App
Production runtime asset revision: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Technical status: merged, deployed, exact-byte verified and production-proven
Release PR: #39
Hotfix merge commit: `2179b7928602b9579dc6e129c40b8739082de80a`
Post-merge visual-test authority: `e966a5a44927992e2e33f602434c5311bf7caee7`
Stability run: `31740111919`
Deployed-site-smoke job: `94581704562`
Release Integration Burn-In: `31740111986` — 2/2 complete stateful journeys passed
Dedicated V1 Visual Immersion: `31740111961`
Production proof: `V1.2.0_R2_PRODUCTION_PROOF.md`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Technical production proof is complete. Separate owner visual acceptance must never be fabricated; future owner screenshots/issues are new evidence.

## r2 hotfix closed

The shipped r2 maintenance release fixed two owner-reported defects without changing gameplay, scoring, canonical persistence, Smart Back or accepted football assets:

1. iOS standalone loading composition is now independent of raw installed-app viewport-height growth. Mobile Reus uses a bounded width-owned top band, stable subject-safe image box and an opacity/filter-only entrance animation that cannot move the protected composition geometry.
2. Floating global install/status presentation was removed. Install/update actions live only in Settings. Service Worker registration, whole-runtime cache verification, connectivity probing, safe activation, offline degradation and previous-runtime recovery remain intact.

Persistent floating/sticky install UI is not an approved pattern. Utility actions should remain inside the appropriate utility surface unless the owner explicitly approves a global overlay.

## Authority when sources disagree

1. current verified source on `main`;
2. explicit later owner decisions;
3. `00_CURRENT_HANDOFF.md`;
4. this file;
5. `NEXT_TASK.md`;
6. current release/maintenance handoff;
7. roadmap/amendments;
8. historical records.

Never revert verified source merely to satisfy stale prose.

## Protected product rules

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league and different permanent clubs;
- maximum Season score 11;
- equal non-zero scores remain Draw;
- only 0–0 uses league position then league points;
- League and Club confirmation checkpoints remain mandatory;
- Transfer Challenge and Season Review state machines remain authoritative;
- Statistics, Legacy and Trophy calculations remain authoritative;
- protected Home/loading visual intent and accepted route-scoped football photos remain locked except for evidence-backed defect fixes.

Scoring remains Champions League +5, domestic League +3, main domestic Cup +1, one shared +1 for 100 League Points/Goals, and one shared +1 for Top Scorer/Top Assist.

## Data and navigation authority

Exactly three canonical localStorage keys remain legal:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`js/storage.js` remains sole persistence/destructive mutation authority. `js/storageTransaction.js` remains the raw transaction engine. Cache Storage contains application bytes only and is never canonical user-data authority.

`js/screens.js` remains sole route/history/Smart Back authority.

Candidate A remains non-mutating export. Candidate B remains strictly read-only analysis. Candidate C is the only import stage allowed to commit canonical state and preserves immutable confirmed intent, strict exact raw snapshot/precondition handling, last-moment prewrite checks, complete in-memory planning, transaction-owned mutation/rollback, anti-clobber semantics, post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery on uncertainty.

## Installable Offline App authority

- current shell: `1.2.0-r2`;
- immediate previous known-good shell: immutable `1.2.0-r1`;
- complete verified cache population before a worker becomes viable;
- no automatic install-time activation;
- explicit Update Ready activation only at safe Home / Showdown Home boundaries;
- Candidate C busy/recovery protection;
- whole-runtime cache selection, never per-file revision mixing;
- current/previous known-good verification and corruption recovery;
- cleanup restricted to this application's cache namespaces;
- unrelated caches preserved;
- worker-owned connectivity verification rather than `navigator.onLine` alone;
- external YouTube media degrades explicitly while the local tracker remains usable;
- PWA controller remains lazy to preserve startup budgets;
- install/update presentation is Settings-owned and may not reappear globally by default.

## CI / testing authority

There remain 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs exercise 13 families because Release Integration Burn-In is main/manual release-only.

Sensitive loading archetypes include desktop, low-height desktop, narrow mobile browser and iOS standalone installed-app height. Composition tests validate relationships and settled geometry, not mere element existence.

Candidate B owns one import browser proof, Candidate C one restore/recovery proof, local Stability provenance + offline lifecycle + complete journey, deployed Stability the exhaustive public boundary, and Release Integration Burn-In two complete stateful journeys. Do not duplicate evidence or weaken gates to obtain green CI.

## Performance locks

- eager raw code ceiling: 165,000 bytes;
- eager gzip ceiling: 37,500 bytes;
- startup Marco Reus portrait ceiling: 95,000 bytes;
- combined first-party startup ceiling: 260,000 bytes;
- normal loading minimum: 2700 ms;
- reduced-motion startup: 220 ms.

## Open PR #37 warning

PR #37 / `agent/v13-hardening` is an open draft, not a trusted baseline. Last inspected head: `221212a87cc58712a1ebd9452d7b71cdaa36327d`.

Its commit `6ce7fe6fab87031b69e3dc5e98587fd3f78b3558` replaced large portions of the proven production DOM during a supposed shell identity freeze while existing JS/CSS still expected the production structure. That caused menu initialization/visibility failures and version-coherence problems. Do not merge or blindly continue that shell. Re-audit PR #37 against current r2 `main`, isolate useful hardening work, and preserve the proven production DOM unless the owner explicitly requests redesign.

See `00_CURRENT_HANDOFF.md` for the detailed warning and known useful PR #37 hardening ideas.

## Historical rollback evidence

v1.2.0 / `1.2.0-r1` remains the immediate immutable previous known-good runtime in `RELEASE_V1.2.0.md` and `CAREER_MODE_SHOWDOWN_V1.2.0_MAINTENANCE_HANDOFF.md`.

v1.1.5 / `1.1.5-r1` remains older immutable historical rollback evidence at runtime SHA `ff755a9863abc843ae9aac45178428e3a104fc65`.

## Current milestone

Immediate legal task: v1.3.0 — Recovery & Device Resilience Hardening, starting from current production `main` / `1.2.0-r2`.

Audit PR #37 and current source before code changes. Investigate browser/device lifecycle, Service Worker recovery, cache corruption, storage failure behavior, Candidate C interruption/ownership uncertainty, Settings/offline/update layering, Smart Back/lazy ownership, Chromebook/mobile/DPR2/accessibility, external-media transitions, dependency/workflow integrity, release coherence and performance headroom. Fix evidence-backed defects only and add focused regression proof.

Cloud, accounts, QR pairing, two-device transport, Local Profiles/Save Library, gameplay changes and framework rewrites remain out of scope unless explicitly authorized.