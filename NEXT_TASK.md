# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-12

Application version: v1.1.4

Runtime asset revision: `1.1.4-r1`

Current production runtime authority until Candidate C merges: `29760bbf33c974267bd1ad64d0839f73ad8051fa` (v1.1.3)

Current Candidate C PR: #24 — `agent/candidate-c-atomic-restore`

Release preparation branch: `agent/v1.1.4-release-freeze`

## Current baseline: v1.1.4 Candidate C Atomic Restore + Recovery UX

Release status: PRE-MERGE RELEASE CANDIDATE / VALIDATION IN PROGRESS

Candidate C implementation is complete. Do not restart Candidate C planning and do not add unrelated roadmap features during release closure.

Candidate A — Versioned Backup Envelope + Non-Mutating Export — remains complete, deployed and protected.

Candidate B — Import Analysis + Migration Preview — remains complete, deployed and protected. Candidate B is still read-only and never grants permission to write merely because a preview is ready.

Candidate C — Atomic Restore + Recovery UX — is implemented and is the first legal stage allowed to commit imported canonical state after fresh revalidation and explicit user decisions.

The last fully proven pre-release-identity Candidate C head is `cf231ec99399837369a53fc5a703f93aec99dcb6`. On that exact implementation/gate baseline:

- all permanent feature/workstream families were green;
- the dedicated Candidate C deterministic + real-browser workflow passed;
- Candidate C browser recovery ran eight isolated scenarios per pass and passed twice;
- the Stability Lane passed both consecutive Chromium cycles with Candidate C restore/recovery included;
- the five-pass Candidate C-inclusive release Burn-In passed 5/5;
- older protected gameplay, visual, Transfer, Season Review, Statistics, Settings, Candidate A and Candidate B workstreams remained green.

The current release-freeze branch advances only release identity, validators, contracts and authority documentation around that already-proven implementation. Do not weaken a threshold or remove an assertion merely to make the release freeze green.

## Candidate C transaction contract — implemented and protected

The legal restore sequence is now:

1. flush pending canonical application writes before restore begins;
2. revalidate the selected/analyzed backup immediately before Apply, including size, JSON/format, checksum, schemas, migrations and unresolved conflicts;
3. snapshot exact raw bytes/absence for every affected canonical key before the first mutation;
4. require explicit user decisions for active Showdown replacement, Legacy merge/conflicts and preference restoration;
5. compute all final values entirely in memory before the first write;
6. keep canonical mutation under the existing storage authority rather than creating a second persistence owner;
7. commit affected keys in deterministic active → Legacy → preferences order;
8. verify every committed key/value after writing;
9. if any write or verification fails, restore all affected keys to exact raw pre-restore bytes;
10. verify rollback byte-for-byte;
11. if rollback cannot be proven, enter a locked critical recovery state and do not claim success;
12. synchronize runtime/in-memory state only after the complete restore verifies;
13. keep repeated import deterministic/idempotent;
14. preserve corrupt raw bytes instead of silently erasing them;
15. keep Export Backup/recovery guidance available before destructive replacement.

## Candidate C UX contract — implemented and protected

Data Management clearly separates:

- current local state;
- analyzed backup state;
- user-selected resolution choices;
- exact planned active/Legacy/preferences effects;
- destructive confirmation;
- restore-in-progress;
- success;
- verified rollback/retry;
- critical rollback failure/locked recovery.

Keyboard, focus, desktop/Chromebook, mobile 390×844 DPR2, reduced motion, overflow, fixed-footer visibility and a 44 px minimum restore-file touch target are in the permanent Candidate C gate.

## Deepened failure-injection coverage

The permanent Candidate C evidence deliberately exercises:

- first-key write failure;
- middle-key write failure after an earlier mutation;
- final-key write failure;
- quota/storage exception;
- post-write verification mismatch;
- rollback write failure / unverified rollback;
- raw key absence;
- corrupt pre-existing local bytes;
- same-ID Legacy conflicts;
- stale reviewed state before Apply;
- rapid/double Apply;
- lifecycle interruption before the synchronous commit boundary;
- repeated import/idempotence;
- responsive/touch/accessibility recovery presentation.

The development cycle also found and fixed four real defects: stale-state UI bypass, rollback-message erasure, destructive-browser process contamination, and a 40 px mobile file input that violated the 44 px touch floor. See `RELEASE_V1.1.4.md` and the Candidate C handoff for the detailed defect record.

## Immediate release task — do this next

Do not implement a new feature. Finish v1.1.4 release closure in this order:

1. complete package/cache/fallback/workflow/authority-document coherence for v1.1.4 / `1.1.4-r1` on the isolated release-freeze branch;
2. confirm the release-freeze branch is a fast-forward descendant of the proven Candidate C PR head;
3. move `agent/candidate-c-atomic-restore` to the single coherent frozen release SHA without force;
4. keep PR #24 draft while the first full final matrix runs;
5. correct any reproduced defect without lowering thresholds;
6. require every permanent workflow family to pass on the same frozen SHA;
7. obtain the second independent permanent-family proof required by the release protocol on that same SHA;
8. inspect Candidate C screenshot artifacts manually for desktop/mobile/recovery state correctness;
9. mark PR #24 ready only after technical release proof is clean;
10. merge with expected-head SHA protection;
11. wait for GitHub Pages to serve `1.1.4-r1`;
12. require Stability production smoke to verify every runtime byte plus runtime provenance, Home/Reus, licensed football visuals, Candidate A export, Candidate B analysis, Candidate C restore/recovery and the complete public journey;
13. repeat required production proof on the same runtime authority;
14. seal the release/handoff documents with the immutable runtime merge SHA and Pages evidence without creating a recursive runtime-document loop.

A green pre-release branch is not deployment proof. Do not call v1.1.4 DEPLOYED / PROVEN until public Pages exact-byte and browser gates pass.

## Protected systems — no unrelated change during release closure

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league / different permanent clubs;
- max-11 scoring and 0–0-only tiebreak logic;
- League selection explicit Continue checkpoint;
- Club Assignment explicit rivalry confirmation checkpoint;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations;
- `js/screens.js` route/history authority;
- storage canonical key/schema ownership;
- Candidate A export semantics;
- Candidate B read-only analysis/migration/conflict-preview semantics;
- accepted football-photo provenance/crop-safe presentation;
- accepted Marco Reus Home/loading separation and loading presentation;
- protected startup budgets: 165,000 raw eager code bytes, 37,500 gzip eager code bytes, 95,000 portrait bytes, 260,000 combined first-party startup bytes.

## Dependency boundary after Candidate C

v1.2.0 remains reserved for the Installable Offline App milestone.

Do not begin PWA/offline installation, profiles/save registry, cloud/accounts, QR pairing or two-device work until v1.1.4 is merged, deployed and proven.

## Required continuation reading

A fresh developer must begin with:

1. `00_HANDOFF_GOLDEN_RULE.md`;
2. `00_DEVELOPER_START_HERE.md`;
3. this `NEXT_TASK.md`;
4. `PROJECT_STATE.md`;
5. `RELEASE_V1.1.4.md`;
6. the active Candidate C / v1.1.4 handoff record;
7. `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_2026-08-12.md`;
8. `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPER_HANDOFF_2026-08-12_ROADMAP_AND_REVIEW_APPENDIX.md`;
9. `CAREER_MODE_SHOWDOWN_V1.1.3_POST_MERGE.md` for the production baseline;
10. `POST_V1_ROADMAP_EXECUTION.md` for the dependency-ordered post-v1 roadmap;
11. live `js/storage.js`, `js/backup.js`, `js/importAnalysis.js`, `js/storageTransaction.js`, `js/restore.js`, `js/restoreUI.js`, `js/legacy.js`, `js/optionalModules.js` and `js/screens.js` before any further implementation.

Continue from the current v1.1.4 release candidate. Do not resume old Candidate A/B branches, old visual branches or pre-Candidate-C planning loops.
