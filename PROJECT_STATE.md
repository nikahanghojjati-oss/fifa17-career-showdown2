# PROJECT STATE — Career Mode Showdown

## Authority / continuation rule

This project is already designed and implemented through v1.1.4 Candidate C Atomic Restore + Recovery UX. v1.1.4 is complete, merged, deployed, twice-proven in production and protected.

Authority when sources disagree:

1. current source on `main`;
2. explicit later owner decisions/amendments;
3. `PROJECT_STATE.md`;
4. `ROADMAP_AMENDMENTS.md`;
5. `NEXT_TASK.md`;
6. release/post-merge handoffs;
7. original Project Bible / architecture documents;
8. older historical records/conversations.

Current source is implementation authority. Do not revert working systems because an older document describes an earlier release. Browser acceptance remains required for visual/interaction work after machine validation.

## Current implementation

**Application version:** v1.1.4 — Stable / Candidate C Complete
**Runtime asset revision:** `1.1.4-r1`
**Hosting:** GitHub Pages
**Technology:** static HTML + CSS + vanilla JavaScript + browser localStorage
**Product mode:** exactly two managers, one device/browser, one active Showdown
**Current milestone:** v1.1 Data Safety and Recovery — COMPLETE / PROTECTED
**Current activity:** v1.1.4 release proof is sealed; do not reopen Candidate C planning
**Current public production:** v1.1.4 / `1.1.4-r1`
**Immutable production runtime authority:** `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`
**GitHub Pages deployment:** `5877215224`
**Frozen pre-merge candidate:** `814c1935824f19144b0b6c41243da71047a3224b`
**Protected loading-screen status:** owner explicitly likes the Marco Reus loading presentation; composition/timing remain regression-protected
**Next legal roadmap milestone:** v1.2.0 — Installable Offline App

Later documentation-only commits are not new application runtime authorities when the served runtime files remain byte-identical to `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`.

## v1.1.4 release proof

Pre-merge:

- frozen SHA `814c1935824f19144b0b6c41243da71047a3224b`;
- 14/14 permanent workflow families green twice independently on the same SHA;
- Candidate C dedicated browser recovery ran twice per matrix;
- Stability ran two complete Chromium cycles per matrix with Candidate A/B/C included;
- Candidate C Release Burn-In passed 5/5 per matrix;
- final Candidate C responsive/recovery screenshots were manually inspected;
- PR #24 merged only with expected-head protection.

Production:

- immutable runtime merge SHA `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`;
- Pages deployment `5877215224` successful;
- all 14 permanent main workflow families green on production attempt 1;
- all 14 rerun on the same SHA as attempt 2 and green again;
- Candidate C production run `31640089247` succeeded on both attempts;
- Burn-In run `31640089314` passed 5/5 twice;
- Stability run `31640089289` passed twice.

Both production Stability attempts proved exact public runtime bytes and then passed runtime provenance, Home/Reus, licensed football visuals, Candidate A export, Candidate B analysis, Candidate C atomic restore/recovery and the complete public gameplay/navigation journey.

See `CAREER_MODE_SHOWDOWN_V1.1.4_POST_MERGE.md` for exact evidence and chronology.

## Candidate C — Atomic Restore + Recovery UX

Candidate A remains non-mutating backup/export. Candidate B remains read-only import analysis/migration/conflict preview. Candidate C is the first stage allowed to commit imported canonical state after fresh revalidation and explicit user choices.

The protected restore transaction:

1. flush pending canonical writes;
2. revalidate backup/choices immediately before Apply;
3. snapshot exact raw active/Legacy/preferences bytes or absence;
4. compute the complete result in memory before mutation;
5. keep writes under existing storage authority;
6. commit in deterministic active → Legacy → preferences order;
7. verify every committed value;
8. on any write/verification failure, roll every affected key back to exact raw pre-restore state;
9. verify rollback byte-for-byte;
10. enter locked critical recovery if rollback cannot be proven;
11. synchronize runtime/in-memory state only after complete success;
12. preserve corrupt raw data and deterministic repeated-import behavior.

Restore UI permanently distinguishes current state, backup state, resolution choices, planned effects, applying, success, verified rollback/retry and critical recovery.

Permanent Candidate C gates cover first/middle/final write failures, quota/storage exception, post-write mismatch, rollback failure, absent raw keys, corrupt bytes, Legacy conflicts, stale reviewed state, rapid/double Apply, lifecycle interruption, idempotence, desktop/Chromebook, mobile 390×844 DPR2, reduced motion, focus, overflow, fixed-footer visibility and 44 px touch targets.

## Candidate C defects reproduced and fixed

Deepened gates found and fixed:

- stale-state UI bypass caused by a pre-confirmation live refresh;
- safe rollback message erasure;
- destructive-browser process contamination across injected failures;
- 40 px mobile restore-file target below the 44 px floor.

The v1.1.4 freeze additionally corrected package-lock identity drift, stale runtime fallbacks, hidden Season Review/Statistics release regexes and the stale historical 22-block workflow topology guard. Current permanent `.yml` source contains 27 literal executable blocks and is gated accordingly.

## Locked competition rules

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- both managers use the same selected league;
- clubs are different and permanent after confirmation;
- Champions League winner = 5 points;
- domestic league winner = 3 points;
- main domestic cup winner = 1 point;
- 100 league points and/or 100 league goals share one +1 performance bonus;
- Top Scorer and/or Top Assist share one +1 awards bonus;
- maximum season score = 11;
- equal non-zero season scores remain a draw;
- only a 0–0 season uses tiebreakers: better league position, then league points;
- League Wheel requires explicit Continue after selection;
- Club Assignment requires explicit rivalry confirmation before the Showdown begins.

## Core authority boundaries

### Routing

`js/screens.js` remains route/history authority. Smart Back remains centralized.

### Persistence

`js/storage.js` remains canonical storage authority for active Showdown, Legacy and application preferences. Candidate C transaction support does not create a second persistence owner.

### Lazy runtime

The startup shell remains one local stylesheet plus seven local scripts. Heavy gameplay, Transfer, Season Review, analytics, Settings, football visuals and Data Management remain lazy. Candidate C transaction/planner/UI/CSS must remain outside eager startup.

### Performance

Protected startup ceilings remain:

- 165,000 raw eager code bytes;
- 37,500 gzip eager code bytes;
- 95,000 startup Marco Reus portrait bytes;
- 260,000 combined first-party startup bytes.

## Current product flow

Main Menu → Create Showdown → League Wheel → explicit league Continue → Club Assignment → explicit rivalry confirmation → Showdown Home → Transfer Challenge → Season Results → Season Review → Edit or Confirm & Save → Season Summary → next season/completion → Legacy / Statistics / Trophy Room.

Legacy / Data Management additionally owns Candidate A backup export, Candidate B read-only import analysis and Candidate C atomic restore/recovery.

## Completed release lineage

- v1.1.4 — Candidate C Atomic Restore + Recovery UX — current production, twice-proven.
- v1.1.3 — League Wheel Stability + Cinematic Football Visual Expansion.
- v1.1.2 — Candidate B Import Analysis + Migration Preview.
- v1.1.1 — James Rodríguez source maintenance.
- v1.1.0 — Candidate A Backup Export.
- v1.0.2 — clean-anchor football-photo maintenance.
- v1.0.1 — Stability hardening.
- v1.0.0 — Version 1 stable baseline.

Detailed historical implementation remains in release records, master continuation handoffs and the Project Bible. Those records are history, not current implementation authority.

## Current gate / next dependency

Candidate C is closed. Do not continue release-freeze work or recreate Candidate C.

The next legal milestone is v1.2.0 — Installable Offline App, following `POST_V1_ROADMAP_EXECUTION.md`.

Profiles/save registry, cloud/accounts, QR pairing and two-device work remain dependency-blocked behind the documented roadmap order.
