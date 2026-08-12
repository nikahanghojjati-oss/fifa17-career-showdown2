# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript and browser localStorage.

**Application version:** v1.1.4 — Candidate C Atomic Restore Release Candidate
**Runtime asset revision:** `1.1.4-r1`
**Current phase:** Candidate C Atomic Restore + Recovery UX is implemented; v1.1.4 pre-merge release validation is in progress
**Current production:** v1.1.3 / `1.1.3-r1` remains public until PR #24 merges and Pages proves v1.1.4
**Protected surface:** the owner-liked cinematic Marco Reus loading presentation remains regression-protected
**Current developer entry:** `00_DEVELOPER_START_HERE.md`
**Immediate task:** finish v1.1.4 release closure; do not start a new feature
**Next roadmap milestone after proof:** v1.2.0 — Installable Offline App
**Post-v1 execution roadmap:** `POST_V1_ROADMAP_EXECUTION.md`

## Development entry point

The project is already designed, architected and implemented through Candidate C. Do not restart planning, replace established architecture or reconstruct the current state from old chats before reading current repository authority.

Read in this order:

1. `00_HANDOFF_GOLDEN_RULE.md` — permanent owner-mandated continuous public handoff protocol.
2. `00_DEVELOPER_START_HERE.md` — fast bootstrap and authority order.
3. `NEXT_TASK.md` — current legal work and release gate.
4. current source — highest implementation authority when documentation and implementation differ.
5. `PROJECT_STATE.md` — current system contracts, locked behavior and release state.
6. `RELEASE_V1.1.4.md` — Candidate C transaction/recovery scope and release proof requirements.
7. `CAREER_MODE_SHOWDOWN_V1.1.4_RELEASE_HANDOFF.md` — current release-freeze chronology and evidence.
8. `CAREER_MODE_SHOWDOWN_CANDIDATE_C_ROLLING_HANDOFF_2026-08-12.md` — Candidate C implementation chronology.
9. `POST_V1_ROADMAP_EXECUTION.md` — dependency-ordered post-v1 roadmap.
10. `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_2026-08-12.md` and its roadmap/review appendix — deeper historical context.
11. historical release records and post-merge evidence when source archaeology is needed.
12. original Project Bible only where later owner decisions/current source have not intentionally superseded it.

## Current release — v1.1.4 Candidate C Atomic Restore + Recovery UX

Candidate C closes the v1.1 Data Safety and Recovery sequence without changing gameplay.

Candidate A remains the non-mutating local backup/export authority. Candidate B remains the read-only import analysis, migration and conflict-preview authority. Candidate C is the first stage allowed to apply imported data, but only after a fresh revalidation and explicit user decisions.

The restore transaction:

- flushes pending canonical writes before Apply;
- revalidates the selected backup immediately before commit;
- snapshots exact raw bytes/absence for active Showdown, Legacy and preferences;
- computes all final values in memory before the first mutation;
- keeps canonical mutation under the existing storage authority;
- commits affected keys in deterministic active → Legacy → preferences order;
- verifies every written value;
- rolls every affected key back to its exact raw snapshot after any write/verification failure;
- verifies rollback byte-for-byte;
- enters a locked critical recovery state if rollback cannot be proven;
- synchronizes in-memory/runtime state only after the complete transaction verifies;
- keeps repeated import deterministic and preserves corrupt raw bytes rather than silently erasing them.

The Data Management UI separates current state, analyzed backup state, resolution choices, planned effects, destructive confirmation, progress, success, safe rollback/retry and critical recovery. Export Backup stays available before the destructive restore surface.

## Candidate C gate depth

The dedicated Candidate C browser lane runs eight isolated recovery/destructive scenarios per pass and executes the complete set twice. Coverage includes stale reviewed state, first/middle/final write failures, quota/storage exceptions, post-write verification mismatch, rollback failure, corrupt local data, Legacy conflicts, rapid/double Apply, lifecycle interruption, repeated import, desktop/Chromebook, mobile 390×844 DPR2, reduced motion, focus, overflow, fixed-footer visibility and a 44 px minimum touch target.

Those gates found four real defects during development and the product was corrected rather than the assertions weakened:

1. a pre-confirmation UI refresh could bypass the explicit stale-state path;
2. safe rollback proof was immediately erased by a refresh;
3. one destructively injected browser process contaminated the next scenario;
4. the mobile restore file picker was only 40 px high.

Candidate C is now also part of the permanent Stability Lane and every pass of the five-pass Release Burn-In.

## Release state

The last fully proven implementation/gate baseline before the v1.1.4 identity freeze is `cf231ec99399837369a53fc5a703f93aec99dcb6`.

That baseline passed:

- all permanent feature/workstream families;
- the dedicated Candidate C workflow;
- both Candidate C browser passes;
- both expanded Stability Chromium cycles with Candidate C included;
- the Candidate C-inclusive five-pass Burn-In at 5/5.

The isolated `agent/v1.1.4-release-freeze` branch changes release identity, validators, contracts and authority documentation around that proven implementation. PR #24 remains the integration/release PR. v1.1.4 must not be called deployed or proven until the frozen PR head passes the complete matrix, merges with expected-head protection, GitHub Pages serves `1.1.4-r1`, exact deployed runtime bytes match and the deployed browser/recovery journeys pass.

## Locked competition rules

- exactly two managers;
- one device/browser and one active Showdown in the current product model;
- Showdown lengths `[1,3,5,10]`;
- one selected league per Showdown and two different permanent clubs;
- Champions League = 5 points;
- league title = 3 points;
- main domestic cup = 1 point;
- 100 league points and/or 100 league goals share one +1 performance point;
- Top Scorer and/or Top Assist share one +1 awards point;
- maximum season score = 11;
- equal non-zero season scores are a draw;
- only a 0–0 score uses tiebreakers: better league position first, then league points;
- League Wheel selection requires explicit Continue before Club Assignment;
- assigned clubs require explicit rivalry confirmation before the Showdown starts.

## Architecture

The served app remains static HTML + CSS + vanilla JavaScript. Persistence remains browser localStorage under `js/storage.js` authority. `js/screens.js` remains route/history authority. Heavy gameplay, analytics, Settings, football photography and Data Management engines remain lazy-loaded.

Candidate C does not add a backend, account system, cloud sync, PWA, profiles/save registry, QR pairing or two-device networking.

The startup shell remains intentionally bounded to one local stylesheet and seven local scripts. Protected ceilings remain 165,000 raw eager code bytes, 37,500 gzip eager code bytes, 95,000 bytes for the startup portrait and 260,000 combined first-party startup bytes.

## Data Safety and Recovery sequence

### v1.1.0 — Candidate A

Added a versioned, human-readable SHA-256-protected local backup export for active Showdown, Legacy and application preferences without mutating canonical storage.

### v1.1.2 — Candidate B

Added preview-only import analysis with size gating, strict format/checksum/schema validation, supported deterministic migrations, hostile/future-data rejection and explicit conflict classification. Candidate B performs zero canonical writes/removals.

### v1.1.4 — Candidate C

Adds atomic restore/recovery as described above and completes the planned v1.1 data-safety milestone after release proof closes.

## Important protected visual releases

### v1.1.3

Fixed the League Wheel post-selection visual reroll and expanded/replaced licensed football photography while preserving route-scoped loading and zero football-photo requests at Home startup. The v1.1.3 runtime remains current public production until Candidate C merges.

### v1.0.2

Established the clean-anchor football-photo rule and protected the owner-liked loading screen from redesign.

### v1.0.0 / v1.0.1

Version 1 sealed the accepted FIFA-17-influenced Home/loading presentation; v1.0.1 added the repository-owned Stability Lane, corrupt-data/quota fixtures, WCAG/browser coverage and exact deployed-byte verification.

See `CHANGELOG.md`, `RELEASE_V*.md` and post-merge handoffs for full historical evidence.

## Next dependency boundary

v1.2.0 is reserved for the Installable Offline App milestone. Do not begin that work until v1.1.4 Candidate C is merged, deployed and proven on public GitHub Pages.
