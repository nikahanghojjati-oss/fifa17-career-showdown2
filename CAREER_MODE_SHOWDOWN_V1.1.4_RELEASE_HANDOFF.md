# Career Mode Showdown — v1.1.4 Release Handoff

Date opened: 2026-08-12
Release: v1.1.4 — Candidate C Atomic Restore + Recovery UX
Runtime revision: `1.1.4-r1`
Current status: PRE-MERGE RELEASE FREEZE / VALIDATION IN PROGRESS
Integration PR: #24 — `agent/candidate-c-atomic-restore`
Release preparation branch: `agent/v1.1.4-release-freeze`
Current public production until merge: v1.1.3 / `1.1.3-r1`

This is the active release-closure handoff. It supplements rather than replaces `CAREER_MODE_SHOWDOWN_CANDIDATE_C_ROLLING_HANDOFF_2026-08-12.md`, which preserves the implementation chronology.

## Owner instruction governing this continuation

The owner instructed development to continue without stopping for approval, deepen gates to catch more bugs, and not call the build successful until deployment/recovery/public smoke gates pass. Work therefore proceeds gate-by-gate; a failing strengthened gate is treated as evidence to investigate, not a reason to lower thresholds.

The owner also requires all actions and conversation-level decisions to be recorded continuously in repository handoff documentation.

## Proven Candidate C implementation baseline before release identity freeze

The last fully proven implementation/gate head before v1.1.4 package/cache/document identity work is:

`cf231ec99399837369a53fc5a703f93aec99dcb6`

On that exact baseline:

- all existing permanent feature/workstream families were green;
- Candidate C deterministic transaction/planning/stale-state contracts were green;
- Candidate C real-browser recovery audit was green twice;
- each Candidate C browser pass executed eight isolated destructive/recovery scenarios;
- Stability passed two consecutive Chromium cycles with Candidate C restore/recovery promoted into the lane;
- the Candidate C-inclusive Release Burn-In passed 5/5 complete passes;
- Candidate A/B, Transfer, Season Review, Statistics, Settings, Home/Reus, League Confirmation, licensed football visuals, Final Polish and other protected workstreams remained green.

PR #24 was deliberately left on this green head while release identity work moved to an isolated fast-forward branch. This avoids producing a sequence of mixed-version PR commits where `index.html`, package metadata, validators and docs temporarily disagree.

## Candidate C defects found by deepened gates

Four concrete defects were discovered and fixed before release freeze:

### 1. Stale-state UI bypass

Apply called a live plan refresh before confirmation. If local state had changed after the reviewed preview, that refresh could silently disable Apply and return before the authoritative stale-state guard ran, leaving the user without the explicit stale-state explanation.

Correction: Apply now validates the user choices against the exact reviewed snapshot and allows the core post-flush stale-state guard to be the authority. Browser evidence requires the visible stale-state message and zero mutation attempts.

### 2. Safe rollback proof erased

The restore transaction correctly rolled back after injected failure, but `finally { refreshPlan(); }` immediately removed the `RESTORE ROLLED BACK` recovery state.

Correction: verified rollback remains visible and permits deliberate retry. Unverified rollback enters a locked critical state where Candidate C controls stay disabled until refresh while Export Backup remains available.

### 3. Destructive browser process contamination

The first injected quota/storage scenario could destabilize the reused Chromium process before a later critical-rollback context even created a page.

Correction: each destructive scenario gets its own Chromium process. This isolates the product scenario under test and prevents one deliberate browser-storage fault from contaminating another.

### 4. Mobile touch target defect

At 390×844 DPR2 the restore file picker measured 40 px high, below the locked 44 px minimum target.

Correction: `css/restore.css` uses `box-sizing:border-box` and `min-height:44px` for the file input. The mobile gate checks it.

## Deepened Candidate C browser coverage

The browser audit now protects eight isolated scenarios per pass and runs all scenarios twice. Coverage includes:

- ready/happy restore planning and application;
- stale local state after review;
- verified safe rollback with persistent proof/retry;
- critical rollback failure with control lock;
- corrupt Legacy/raw-state choice handling;
- rapid/double Apply activation;
- lifecycle interruption before the synchronous transaction boundary;
- desktop + mobile DPR2/reduced-motion/footer-safe scroll/touch behavior.

Deterministic contracts separately cover first/middle/final key failures, quota/storage failure, post-write mismatch, rollback failure, exact raw absence, Legacy conflicts and idempotence.

## Permanent gate promotion completed before release freeze

Candidate C is now protected outside its dedicated workflow:

- `.github/workflows/validate-stability-lane.yml` runs `npm run test:restore-browser` inside both local Chromium cycles;
- the `main` deployed-site smoke runs Candidate C restore/recovery against public Pages after exact-byte convergence;
- Candidate A/B/C screenshots are owned by Stability evidence;
- `tests/support/run-release-burnin-pass.sh` runs Candidate C restore/recovery on every pass;
- `.github/workflows/validate-v110-release-burnin.yml` is now identified as Candidate C Release Burn-In;
- all five Burn-In passes passed on the proven pre-freeze baseline;
- static hardening protects stale-state bypass, rollback message persistence, critical control lock, touch target floor and destructive scenario coverage.

## Release-freeze strategy

Release version remains inside v1.1.x because `POST_V1_ROADMAP_EXECUTION.md` reserves v1.2.0 for Installable Offline App.

The release identity selected for Candidate C is:

- app version: v1.1.4;
- runtime/cache revision: `1.1.4-r1`.

A separate branch `agent/v1.1.4-release-freeze` was created from the proven Candidate C head. PR #24 remains untouched until this branch becomes coherent.

## Release-freeze commits and actions

The release preparation branch advanced through these commits before this handoff was opened:

- `0ad273b998a01f9097064edc45820ef4471348f1` — freeze `APP_VERSION` and visual-fidelity cache identity at v1.1.4 / `1.1.4-r1`;
- `4f74c65ec71e6f6417c6c1bd8a4cebd5d41d6a34` — set `package.json` to 1.1.4;
- `62614f676a67ddb6a2070fedd7d9226c1217c920` — set `index.html` meta/footer/all eager asset revisions to `1.1.4-r1`;
- `4faa54da1d22321ceac8b1e9def1ca67ac919daa` — add repository-owned dynamic Static App release contract;
- `140a594c0e129ca0c5be7d037e208ba61a279ac6` — align top-level/root `package-lock.json` version to 1.1.4;
- `794888c6c6d2a2b45fda96372f02a6709be639e3` — replace version-fragile inline Static App workflow with four version-agnostic repository-owned validation blocks while preserving the permanent 22-block workflow topology;
- `3343bd179ca0a6a817bc82d3a81173d604b9bbcf` — promote dynamic Static App release contract into `npm run test:contracts`;
- `c0685b3462bd8bec2fb5e79f614dac147def52e6` — deepen dynamic release contract with lockfile, actual 2700 ms loading minimum, club/route/storage authority, completed-showdown recovery and Candidate C lazy-loading checks;
- `4b670000f4415de835aacffe6344eda2d9fffeeb` — add `RELEASE_V1.1.4.md`;
- `9cc7e9903279e62017c4b9fc3668099480ba7d0f` — align Stability contracts with Candidate C production-smoke/Burn-In ownership;
- `9aea370e352f509e4ec8b9ce396b1412b343039e` — advance `NEXT_TASK.md` to v1.1.4 release closure;
- `810f7c265a7bdda56a9f053157b43f90338b4cb1` — align README with v1.1.4 Candidate C release candidate;
- `e544fe2088908fd1fd8f6b4f94b3f696f9cd38d9` — advance PROJECT_STATE to current v1.1.4 release state;
- `de8ed0d60602755415a18e20b7817d71e6174416` — add a temporary `.yaml` release-freeze preflight workflow so the isolated branch can run stale-literal diagnostics and repository contracts before PR #24 is moved.

The temporary preflight uses `.yaml`, not `.yml`, so it does not alter the project’s permanently protected 22 literal `run: |` block topology. It must be removed before the release branch is promoted into PR #24.

## Dynamic Static App release contract

`tests/contracts/static-app-release-contracts.cjs` now derives current identity from source/package metadata rather than hardcoding the previous release. It protects:

- `APP_VERSION`, `package.json`, `package-lock.json`, footer and `app-asset-revision` coherence;
- current release record existence/tag/revision;
- immutable older release revision records;
- max-11 scoring and 0–0-only tiebreak logic;
- route checkpoint/state matrix;
- 98 unique club identities and procedural crest contract;
- no official badge image embedding;
- finite/reduced-motion club reveal and persistence checkpoints;
- CSS structural validity;
- accepted Home grid/media rail/breakpoints/safe width;
- normal startup 2700 ms and reduced-motion startup 220 ms;
- unique shell IDs;
- exactly one local eager stylesheet and seven eager scripts;
- Candidate C and all other heavy modules excluded from eager startup;
- 165,000 raw / 37,500 gzip eager code budgets;
- 95,000 startup portrait and 260,000 combined first-party startup ceilings;
- centralized Smart Back and route-history authority;
- localStorage authority boundary;
- no global function collisions;
- completed-showdown recovery copy;
- dead prototype architecture absence;
- Candidate C transaction/planner/UI/CSS lazy loading through Legacy/Data Management.

The original oversized Static App workflow contained four literal run blocks. The replacement also contains exactly four, so `tests/support/run-workflow-blocks.cjs` continues to assert the unchanged project-wide total of 22 permanent executable workflow blocks.

## Current preflight purpose

The temporary freeze preflight is intended to answer two questions before PR #24 moves:

1. which active runtime/workflow/test files still contain stale current-release `1.1.3-r1` or `1.1.2` fallbacks;
2. whether the complete repository contract suite and the 22 legacy workflow blocks pass on the isolated v1.1.4 identity/document state.

Any stale active literal found in runtime/workflows is to be corrected. Historical v1.1.3/v1.1.2 release records are not stale merely because they retain their immutable historical identities.

## Remaining pre-PR work

Before moving PR #24:

1. inspect the temporary preflight log;
2. correct stale active release fallbacks/validators without touching immutable historical release evidence;
3. add the v1.1.4 CHANGELOG entry;
4. ensure current README/PROJECT_STATE/NEXT_TASK/RELEASE record agree;
5. remove the temporary preflight workflow;
6. confirm release-freeze head is a fast-forward descendant of PR #24 head;
7. update `agent/candidate-c-atomic-restore` to the final freeze SHA without force.

## Final PR proof required

After PR #24 moves to the frozen release SHA:

- all permanent workflow families must pass on that same SHA;
- Candidate C dedicated browser audit must remain twice-green;
- Stability must remain two-cycle green with Candidate C included;
- Burn-In must remain 5/5;
- final Candidate C screenshots must be manually inspected;
- the release protocol requires a second independent permanent-family matrix on the same frozen SHA before merge;
- PR must merge with expected-head SHA protection.

No release-success claim is legal before those gates finish.

## Production proof required after merge

After merge:

1. wait for GitHub Pages to serve `1.1.4-r1`;
2. exact-byte deployment verifier must match every runtime file under index/css/js/data/assets;
3. deployed runtime provenance must pass;
4. deployed Home/Reus and licensed football visuals must pass;
5. Candidate A export must pass;
6. Candidate B analysis must pass;
7. Candidate C restore/recovery must pass;
8. complete public gameplay/navigation journey must pass;
9. required production proof must be repeated on the same runtime authority;
10. final release/handoff docs must record the immutable runtime merge SHA and Pages evidence.

Until then v1.1.4 remains PRE-MERGE or, after merge but before proof, DEPLOYMENT VALIDATION IN PROGRESS.

## Next dependency boundary

v1.2.0 remains Installable Offline App. Do not start PWA/offline installation, profiles/save registry, cloud/accounts, QR pairing or two-device work until v1.1.4 is deployed and proven.
