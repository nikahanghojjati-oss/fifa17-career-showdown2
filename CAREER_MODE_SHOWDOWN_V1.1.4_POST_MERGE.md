# Career Mode Showdown v1.1.4 — Post-Merge / Production Handoff

## Status

v1.1.4 is COMPLETE, MERGED, DEPLOYED, TWICE-PROVEN IN PRODUCTION, and PROTECTED.

- Application: `v1.1.4`
- Runtime asset revision: `1.1.4-r1`
- Frozen official pre-merge candidate: `814c1935824f19144b0b6c41243da71047a3224b`
- PR: #24 — `v1.1.4 Candidate C: Atomic Restore + Recovery UX`
- Immutable production runtime authority: `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`
- GitHub Pages deployment: `5877215224`
- Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
- Next legal milestone: v1.2.0 — Installable Offline App.

This document is the final v1.1.4 production handoff. It supplements, rather than replaces, `CAREER_MODE_SHOWDOWN_CANDIDATE_C_ROLLING_HANDOFF_2026-08-12.md`, `CAREER_MODE_SHOWDOWN_V1.1.4_RELEASE_HANDOFF.md`, `RELEASE_V1.1.4.md`, and the master development handoffs.

## Candidate C delivered scope

Candidate C completes the planned v1.1 Data Safety and Recovery sequence.

Candidate A remains the non-mutating versioned backup/export authority. Candidate B remains the read-only import analysis/migration/conflict-preview authority. Candidate C is the first stage allowed to apply imported canonical state, but only after fresh revalidation and explicit user choices.

The final restore transaction:

1. flushes pending canonical writes before restore;
2. revalidates the selected backup immediately before Apply, including size/format/checksum/schema/migrations/conflicts;
3. snapshots exact raw active Showdown, Legacy and application-preference bytes or key absence;
4. requires explicit active/Legacy/preferences choices;
5. computes the complete final state in memory before the first mutation;
6. keeps canonical mutation under the existing storage authority;
7. commits affected keys in deterministic active → Legacy → preferences order;
8. verifies every written key/value after commit;
9. restores every affected key to its exact raw pre-restore state after any write/verification failure;
10. verifies rollback byte-for-byte;
11. enters a locked critical recovery state if rollback cannot be proven;
12. synchronizes in-memory/runtime state only after the complete transaction verifies;
13. keeps repeated import deterministic/idempotent;
14. preserves corrupt raw bytes instead of silently erasing them.

## Recovery UX delivered

The lazy Legacy / Data Management surface separates:

- current local state;
- analyzed backup state;
- explicit resolution choices;
- exact planned active/Legacy/preferences effects;
- destructive confirmation;
- restore-in-progress state;
- success state;
- verified rollback with deliberate retry;
- critical rollback failure with Candidate C controls locked until refresh.

Export Backup remains available before destructive restore. Desktop/Chromebook, mobile 390×844 DPR2, reduced motion, focus, overflow, fixed-footer-safe scrolling and the 44 px restore-file touch target are permanently gated.

## Product/test defects found by deepened Candidate C gates

The owner requested deeper gates and the release treated failures as bug reports rather than lowering thresholds. Four concrete Candidate C defects were reproduced and corrected:

1. Apply performed a live plan refresh before confirmation, which could silently bypass explicit stale-state feedback. Apply now preserves the reviewed snapshot and the authoritative post-flush stale-state guard decides whether commit is legal.
2. A safe rollback was immediately followed by a refresh that erased `RESTORE ROLLED BACK`. Verified rollback proof now persists and supports deliberate retry; unverified rollback locks Candidate C controls.
3. Reusing one Chromium process after deliberately injected storage failures contaminated later recovery scenarios. Each destructive scenario now runs in an isolated browser process.
4. The mobile restore file input measured 40 px high at 390×844 DPR2. It now has a 44 px minimum height with border-box sizing.

The dedicated browser audit executes eight isolated destructive/recovery scenarios per pass and runs the full set twice. Deterministic contracts separately cover first/middle/final-key failures, quota/storage exceptions, post-write mismatch, rollback failure, exact raw absence, corrupt pre-existing bytes, same-ID Legacy conflicts and idempotence.

## Release-freeze infrastructure defects found and corrected

The v1.1.4 freeze also exposed release-infrastructure drift that earlier feature matrices did not exercise:

- `package.json` had advanced to 1.1.4 while `package-lock.json` still identified 1.1.3;
- active Home/Reus, football-visual, optional-loader, Settings and contract-fixture fallbacks still carried old current-release literals;
- Home Bootstrap, V1 Visual Immersion, Final Polish and Licensed Football Visuals had version-fragile current-app assumptions;
- Season Review contained a hidden `^1.1.3-rN` shell regex;
- Statistics contained the same hidden release-pattern class;
- the legacy workflow topology guard still expected 22 executable blocks although current permanent source now contains 27.

These were corrected at source. Unique Final Polish, visual-provenance, Season Review and Statistics assertions were extracted into repository-owned dynamic contracts and promoted into `npm run test:contracts`, so Stability and Burn-In own those checks too. The current permanent `.yml` topology is explicitly locked at 27 literal executable blocks.

## Pre-merge proof — 2× on one immutable candidate

Frozen candidate: `814c1935824f19144b0b6c41243da71047a3224b`.

The first authoritative PR matrix passed every one of the 14 permanent workflow families green on that exact SHA.

A second independent matrix was created by reopening the same draft PR without changing a byte or SHA. All 14 permanent families ran again and completed green on the same frozen head.

The deep gates in each matrix included:

- Candidate C dedicated deterministic contracts plus two real-browser recovery passes;
- Stability contracts plus two consecutive complete Chromium cycles with Candidate A/B/C included;
- five complete Candidate C-inclusive Release Burn-In passes;
- Licensed Football Visual responsive browser screenshots;
- every older protected gameplay, Transfer, Season Review, Statistics, Settings, League, Home/Reus, visual and Final Polish family.

Across the two official pre-merge matrices Candidate C therefore completed four dedicated real-browser recovery passes, Stability completed four full local cycles, and Burn-In completed 10/10 full passes.

Frozen Candidate C screenshot evidence from run `31638757897`, artifact `9158062005`, digest `sha256:b6f25aa83a99a2ef6b906f59b4eeb215b60d1c93f760aebebba9d9d196f43a2e`, was manually inspected. Desktop ready state, mobile DPR2, verified rollback and critical rollback lock were clean; no horizontal escape or fixed-footer obstruction was observed.

PR #24 was marked ready only after both matrices and manual evidence review passed, then merged with `expected_head_sha` protection against exactly `814c1935824f19144b0b6c41243da71047a3224b`.

## Immutable runtime and Pages deployment

The expected-head merge produced runtime authority:

`1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`

GitHub Pages deployment `5877215224` completed successfully for that SHA.

The public release remained unproven until Stability verified that Pages served `1.1.4-r1` and every runtime file under `index.html`, `css`, `js`, `data` and `assets` matched the immutable runtime byte-for-byte.

## Production Pass 1 — 14/14 GREEN

All fourteen permanent main-branch workflow families completed successfully on runtime SHA `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`:

- Transfer Workstream — `31640089400`
- V1 Visual Immersion — `31640089365`
- Season Review — `31640089352`
- Settings Workstream — `31640089167`
- Home Bootstrap — `31640089226`
- Static App — `31640089305`
- League Confirmation — `31640089319`
- Final Polish — `31640089284`
- Statistics Workstream — `31640089313`
- Candidate B Import Analysis — `31640089240`
- Candidate C Atomic Restore — `31640089247`
- Stability Lane — `31640089289`
- Licensed Football Visuals — `31640089360`
- Candidate C Release Burn-In — `31640089314`

Candidate C run `31640089247` completed deterministic contracts and its twice-browser destructive/recovery audit successfully.

Burn-In run `31640089314` completed all five full release passes successfully.

Stability run `31640089289` completed repository contracts, two consecutive complete local Chromium cycles, and deployed-site smoke successfully.

The first deployed-site smoke passed, in order:

1. exact public runtime-byte verification;
2. runtime error provenance;
3. Home/Reus visual audit;
4. licensed crop-safe football-photo audit;
5. Candidate A backup export;
6. Candidate B import analysis;
7. Candidate C atomic restore/recovery;
8. complete public gameplay/navigation journey.

## Production Pass 2 — 14/14 GREEN

Without changing repository bytes or the runtime SHA, every permanent main workflow was rerun as `run_attempt: 2`.

The same fourteen workflow run IDs therefore now hold independent second-attempt evidence on the same immutable runtime authority.

Fresh Candidate C attempt-2 jobs regenerated and passed, including a new twice-browser recovery audit.

Fresh Licensed Football Visual attempt-2 jobs regenerated and both passed, including the responsive browser audit.

Fresh Burn-In attempt-2 jobs regenerated all five matrix passes and all five completed successfully. Burn-In run `31640089314` therefore proves 5/5 on attempt 1 and 5/5 again on attempt 2.

Fresh Stability attempt-2 jobs were:

- stability contracts — `94264478956` — SUCCESS;
- two-cycle Chromium — `94264531141` — SUCCESS;
- deployed-site smoke — `94266314073` — SUCCESS.

The second deployed-site smoke again passed every required public step:

1. exact public runtime-byte verification;
2. runtime error provenance;
3. Home/Reus visual audit;
4. licensed crop-safe football-photo audit;
5. Candidate A backup export;
6. Candidate B import analysis;
7. Candidate C atomic restore/recovery;
8. complete public gameplay/navigation journey.

Production therefore has two independent full main-branch proofs, two independent exact-byte/public Stability proofs, Candidate C destructive recovery proven repeatedly on the deployed URL, and Burn-In 10/10 across the two production attempts.

## Documentation-seal correction

After both production proofs were complete, the first documentation-seal action accidentally created `CAREER_MODE_SHOWDOWN_V1.1.4_POST_MERGE.md` on `main` with one-word placeholder content instead of first creating the intended docs-only branch. That documentation-only commit did not change `index.html`, `css`, `js`, `data` or `assets`, so it did not change the immutable application runtime authority `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`.

The placeholder was immediately detected and replaced with this complete handoff. The mistake is recorded here rather than erased from history. Final documentation-coherence CI after the seal is required before closure is considered complete.

## Protected subsystem confirmation

v1.1.4 does not alter:

- exactly-two-manager model;
- Showdown lengths `[1,3,5,10]`;
- same-league / different permanent-club rules;
- max-11 scoring;
- equal non-zero score = draw;
- 0–0-only tiebreak logic;
- League Wheel explicit Continue checkpoint;
- Club Assignment explicit rivalry-confirmation checkpoint;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations;
- `js/screens.js` route/history authority;
- Candidate A format/checksum/non-mutating export semantics;
- Candidate B read-only analysis/no-write semantics;
- accepted licensed football-photo provenance and crop-safe presentation;
- owner-liked Marco Reus Home/loading separation and loading presentation;
- protected startup ceilings of 165,000 raw eager code bytes, 37,500 gzip eager code bytes, 95,000 startup portrait bytes and 260,000 combined first-party startup bytes.

Candidate C remains lazy inside Legacy / Data Management and does not add an eager startup dependency.

## Release conclusion

v1.1.4 is technically closed and protected.

The immutable production runtime authority is `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7`. Later documentation-only seal commits must not be mistaken for a new application runtime authority when runtime files are byte-identical.

## Next task

The v1.1 Data Safety and Recovery sequence is complete.

The next legal roadmap milestone is v1.2.0 — Installable Offline App, as reserved in `POST_V1_ROADMAP_EXECUTION.md`.

Do not begin profiles/save registry, cloud/accounts, QR pairing or two-device work ahead of the dependency order. Read `NEXT_TASK.md` before implementation.
