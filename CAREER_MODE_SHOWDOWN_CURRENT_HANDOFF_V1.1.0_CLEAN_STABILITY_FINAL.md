# Career Mode Showdown — Exact Current Handoff

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: single current-stop handoff for the next ChatGPT, Work, or developer session.

This document is intentionally written so the next developer can continue without reconstructing the project from chat history.

---

## 1. Read this first

Before changing anything:

1. Fetch current `main` and record its SHA.
2. Read `00_DEVELOPER_START_HERE.md`.
3. Read `NEXT_TASK.md`.
4. Read this file completely.
5. Read the relevant current milestone in `POST_V1_ROADMAP_EXECUTION.md`.
6. Inspect current source before writing code.

Do **not** restart planning, reopen completed PRs, or treat old chronology as newer than current source.

The fully validated repository seal immediately before this handoff file was created is:

`30ae13435d61a5065a366cc80b15b9db63174510`

That SHA is the authoritative technical evidence baseline described below. This handoff file itself is a documentation-only successor; because a commit cannot record its own SHA before it exists, the next developer must fetch current `main` when starting.

---

## 2. Current application state

Application version:

`v1.1.0`

Runtime asset revision:

`1.1.0-r1`

Hosting:

GitHub Pages

Public site:

`https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Technology:

- static HTML;
- CSS;
- vanilla JavaScript;
- browser localStorage;
- GitHub Pages;
- Playwright/Chromium/axe in repository-owned CI.

Product model remains:

- exactly two managers;
- one browser/device;
- one active local Showdown;
- manual FIFA 17 result entry;
- permanent same-league/different-club rivalry;
- local-only persistence unless a later roadmap milestone explicitly changes that.

No framework migration or architecture rewrite is authorized.

---

## 3. Current runtime lineage

v1.1.0 Candidate A runtime implementation merge:

`7aba9609130e7f72f256bfb20936441e8beaecaa`

That release introduced Candidate A and bounded maintenance fixes.

The later Clean Stability Build deliberately did **not** change application runtime bytes because no runtime defect reproduced.

Clean Stability PR:

`#15 — v1.1.0 Clean Stability Build`

Final PR head:

`533560464bfb55cbe482f586c07a488bc8a569fa`

PR #15 merge commit:

`5002069b2babcc79c9fdb803b5ae3ec7b2266fc6`

Production-proof documentation seal immediately before this handoff:

`30ae13435d61a5065a366cc80b15b9db63174510`

Important distinction:

- `7aba9609...` is the v1.1.0 runtime implementation merge;
- `5002069b...` is the clean-stability release-seal merge;
- `30ae1343...` is the final fully validated production-proof documentation state before this dedicated handoff file.

The clean-stability work does **not** justify renaming the app to v1.1.1 because no runtime patch was required.

---

## 4. What v1.1.0 Candidate A contains

Candidate A is complete, merged, deployed and technically proven.

Feature:

**Versioned Backup Envelope + Non-Mutating Export**

Implemented behavior:

- exports active Showdown;
- exports Legacy history;
- exports application preferences;
- includes backup format/version metadata;
- includes application/runtime diagnostics;
- includes export timestamp;
- includes record counts;
- records completed-active/Legacy relationships where applicable;
- uses SHA-256 integrity checking;
- produces human-readable JSON;
- preserves malformed raw storage in labelled recovery data;
- downloads locally with a timestamped filename;
- performs zero canonical `localStorage.setItem()` calls during export;
- performs zero canonical `localStorage.removeItem()` calls during export;
- preserves existing Showdown IDs and timestamps.

Architecture boundary:

- `js/storage.js` remains the authoritative persistence/read boundary;
- `js/backup.js` is lazy and handles backup interpretation/checksum/download;
- Candidate A did not create a second persistence system.

Candidate B and Candidate C are **not implemented**.

---

## 5. v1.1.0 maintenance fixes already present

The v1.1.0 release contains these bounded maintenance fixes:

1. A corrupt non-empty active save does not advertise a usable Continue Career state.
2. Malformed Legacy JSON/top-level shape is not silently interpreted as an empty valid archive; raw bytes remain recoverable.
3. Settings no longer falls back to the stale v1.0.1 identity.
4. Destructive Data Management actions give explicit success feedback only after successful commit.
5. Backup export is single-flight under rapid repeated activation.
6. Shared compact/back controls meet the mobile touch-target floor.
7. Football-photo evidence waits for decode/paint settlement before screenshots are accepted.
8. Corrupt active raw data is protected from silent New Showdown overwrite even though Continue remains disabled.
9. Probing a supported corrupt/recovery state is console-clean rather than treated as an application crash.
10. Corrupt-save confirmation regression testing fails fast instead of consuming a long CI timeout.
11. Optional-module navigation propagates the real route result instead of reporting false-positive success.
12. Startup stayed under the permanent 165,000-byte raw ceiling; the ceiling was never raised to make Candidate A fit.

Do not undo these fixes while implementing later roadmap work.

---

## 6. Visual state and owner decisions

The owner approved the v1.0.2 visual direction and then clarified an important amendment:

The FIFA-17-inspired diagonal line effect should **remain**; the problem was that lines crossed player faces/heads.

Current v1.1 visual rule:

**player is the clean anchor; diagonal energy may exist only in face-safe/lower-body/photo-edge zones.**

Current protected surfaces:

- James Rodríguez — no facial washout; clean anchor; identity plate/photo composition protected;
- Marcus Rashford — face/head must remain unobstructed;
- Anthony Martial — same face-safe treatment;
- Home Marco Reus — rectangular anchor; no rejected diagonal head/neck crop; bounded lower-body accent allowed;
- loading/startup Marco Reus — explicitly liked by the owner and regression-protected;
- Messi — protected prior presentation;
- Lahm — protected prior presentation.

Automated visual success is **not** the same as owner subjective acceptance.

The owner approved the earlier v1.0.2 direction, but the later v1.1 face-safe accent retune has not been explicitly signed off by the owner as a separate real-device art-direction gate in the current recorded state.

Do not claim otherwise.

---

## 7. Clean Stability Build request and result

The owner asked for a clean build based on the deployed v1.1.0 state and specifically required:

- all normal release gates;
- each feature/workstream gate;
- the five-pass release comparison/burn-in;
- deployment proof;
- a stable, bug-free release rather than a superficial CI summary.

Clean branch:

`agent/v1.1.1-clean-stability`

It was cut directly from previously proven production `main`:

`d23cea4d0a8bb3c428265546555a78008269d228`

The branch name contains `v1.1.1`, but the release remained **v1.1.0 / 1.1.0-r1** because no runtime defect reproduced. Do not infer application version from the branch name.

### Runtime defects reproduced during the clean build

`0`

### Defect actually found

`1 continuation/authority defect`

Highest-authority developer documents were stale and still described v1.0.2 / pre-merge PR #14 as if they were current.

Corrected files:

- `00_DEVELOPER_START_HERE.md`;
- `PROJECT_STATE.md`;
- `README.md`;
- `NEXT_TASK.md`;
- clean-stability handoff chronology.

Application runtime bytes changed by the clean-stability build:

`0`

No HTML/CSS/JavaScript/data/media/storage behavior was changed by that seal.

---

## 8. Permanent workflow inventory

There are twelve permanent release/workstream workflow families that were required for the clean seal:

1. Validate Home Bootstrap
2. Validate League Confirmation
3. Validate Transfer Workstream
4. Validate Season Review
5. Validate Statistics Workstream
6. Validate Settings Workstream
7. Validate V1 Visual Immersion
8. Validate Licensed Football Visuals
9. Validate Final Polish
10. Validate Static App
11. Validate Stability Lane
12. Validate v1.1.0 Release Burn-In

The burn-in workflow itself creates **five independent complete release runners**.

A failure, cancellation, timeout, or skipped required main-only deployment job is not counted as a pass.

Performance/test gates were not weakened to obtain green CI.

---

## 9. Clean-build proof sequence

### A. First untouched-production reproducibility candidate

Candidate:

`12c3e428e278243dbe9d6b9750bbbb95f2f154ca`

This changed only the initial clean-build handoff relative to production and therefore acted as a clean reproducibility check of the already-deployed runtime.

All twelve permanent workflow families passed.

Five independent burn-in jobs also passed 5/5.

Stability contracts and two complete Chromium cycles passed.

The deployed-site Stability job was correctly skipped because this was a PR candidate.

### B. Corrected authority candidate

After fixing stale continuation authority and removing temporary helper tooling:

`18e7a90a800053c760bd211f3ab69601a84ad4ad`

Again:

- all twelve workflows passed;
- five-pass burn-in passed 5/5;
- Stability contracts passed;
- two consecutive complete Chromium cycles passed;
- no runtime file changed.

### C. Final documentation-inclusive PR head

`533560464bfb55cbe482f586c07a488bc8a569fa`

This exact SHA re-earned all twelve workflows before merge.

PR-side workflow runs:

- Home Bootstrap `31527594679` — SUCCESS;
- League Confirmation `31527594693` — SUCCESS;
- Transfer Workstream `31527594676` — SUCCESS;
- Season Review `31527594690` — SUCCESS;
- Statistics Workstream `31527594686` — SUCCESS;
- Settings Workstream `31527594683` — SUCCESS;
- V1 Visual Immersion `31527594674` — SUCCESS;
- Licensed Football Visuals `31527594698` — SUCCESS;
- Final Polish `31527594777` — SUCCESS;
- Static App `31527594741` — SUCCESS;
- Stability Lane `31527594774` — contracts + two Chromium cycles SUCCESS;
- Release Burn-In `31527594719` — SUCCESS, 5/5.

Final-PR burn-in jobs:

- pass 1 `93899638190` — SUCCESS;
- pass 2 `93899638070` — SUCCESS;
- pass 3 `93899638121` — SUCCESS;
- pass 4 `93899638087` — SUCCESS;
- pass 5 `93899638102` — SUCCESS.

PR Stability jobs:

- contracts `93899697365` — SUCCESS;
- two-cycle Chromium `93899697366` — SUCCESS;
- deployed-site `93900810251` — SKIPPED by design on PR.

PR #15 then merged with exact-head protection.

---

## 10. Merge/deployment proof

PR #15 merge commit:

`5002069b2babcc79c9fdb803b5ae3ec7b2266fc6`

GitHub Pages deployment for the merged clean-stability state succeeded.

All twelve permanent workflows passed again on the merge SHA.

Production Stability included:

- storage/release/CI contracts;
- two consecutive Chromium cycles;
- exact deployed runtime-byte parity;
- deployed runtime-error provenance;
- deployed Home/Reus audit;
- deployed licensed/crop-safe football-photo audit;
- deployed Candidate A backup/export audit;
- complete public gameplay/browser journey.

Production burn-in also passed 5/5.

This proved the clean release after merge, not just in the PR environment.

---

## 11. Final fully validated production-proof SHA before this handoff

Immediately before creating this dedicated current-stop file, `main` was:

`30ae13435d61a5065a366cc80b15b9db63174510`

Commit message:

`Record v1.1.0 clean stability production proof`

Parent:

`5002069b2babcc79c9fdb803b5ae3ec7b2266fc6`

That commit changed only the public clean-stability handoff record.

### All twelve push workflows passed on `30ae1343...`

- Season Review `31528900006` — SUCCESS;
- V1 Visual Immersion `31528900033` — SUCCESS;
- Static App `31528900245` — SUCCESS;
- Transfer Workstream `31528900028` — SUCCESS;
- Home Bootstrap `31528900076` — SUCCESS;
- League Confirmation `31528900079` — SUCCESS;
- Statistics Workstream `31528900095` — SUCCESS;
- Settings Workstream `31528900093` — SUCCESS;
- Licensed Football Visuals `31528900011` — SUCCESS;
- Final Polish `31528900188` — SUCCESS;
- Release Burn-In `31528900023` — SUCCESS;
- Stability Lane `31528900022` — SUCCESS.

At the final check on that SHA:

- failed push workflows: `0`;
- in-progress push workflows: `0`;
- queued push workflows: `0`.

### Final 5/5 burn-in on `30ae1343...`

Run:

`31528900023`

Jobs:

- pass 1 `93903877391` — SUCCESS;
- pass 2 `93903877322` — SUCCESS;
- pass 3 `93903877309` — SUCCESS;
- pass 4 `93903877416` — SUCCESS;
- pass 5 `93903877361` — SUCCESS.

Each pass executed the complete release gate sequence:

- JavaScript syntax;
- deterministic contracts;
- runtime provenance;
- Home/Reus visual audit;
- licensed football visual audit;
- Candidate A backup/export browser audit;
- complete gameplay/browser journey.

### Final Stability proof on `30ae1343...`

Run:

`31528900022`

Jobs:

- stability contracts `93903876550` — SUCCESS;
- two-cycle Chromium Stability `93903936468` — SUCCESS;
- deployed-site smoke `93905025993` — SUCCESS.

The deployed-site smoke passed every required stage:

1. wait for GitHub Pages and verify every runtime byte — SUCCESS;
2. deployed runtime error provenance — SUCCESS;
3. deployed Home/Reus visual audit — SUCCESS;
4. deployed crop-safe football-photo audit — SUCCESS;
5. deployed Candidate A backup export audit — SUCCESS;
6. deployed complete journey — SUCCESS.

Candidate A Data Management screenshot artifact from final Stability:

- artifact ID `9116184949`;
- name `candidate-a-backup-browser-31528900022`;
- digest `sha256:7f709d146bfbd66d80b7226f18c5f0aadea3f1d8339ef1dea6dde6447d74f5a4`.

Licensed Football Visual artifact from final main proof:

- artifact ID `9116089337`;
- name `licensed-football-visual-r5-30ae13435d61a5065a366cc80b15b9db63174510`;
- digest `sha256:50db51efa9f4a3aa0788e414ffa4b31935e83ec38b4d17dad8c4abaca74eb9b0`.

---

## 12. Final GitHub Pages state before this handoff

Deployment ID:

`5857350485`

Deployment SHA:

`30ae13435d61a5065a366cc80b15b9db63174510`

Deployment environment:

`github-pages`

Deployment status:

`SUCCESS`

Pages deployment workflow run:

`31528898929`

Public environment:

`https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The final Stability deployed-site smoke independently verified the public runtime after Pages deployment; do not rely only on the Pages green badge.

---

## 13. What is NOT pending

The next developer must not waste time redoing these items:

- do not reopen PR #14;
- do not reopen PR #15;
- do not restart Candidate A;
- do not repeat v1.0.2 James/Rashford/Martial source-selection work without new owner evidence;
- do not redesign the owner-liked loading screen;
- do not re-run the clean-stability seal merely because the branch name says v1.1.1;
- do not invent a v1.1.1 runtime release when application bytes have not changed;
- do not start restore writes under Candidate B;
- do not jump to PWA/profiles/cloud/two-device work.

The clean-stability build is technically complete.

---

## 14. What remains open

There are only two kinds of legitimate next action.

### A. Owner supplies new defect or visual rejection

If the owner provides reproducible new evidence, fix that evidence narrowly on a new branch from current `main`.

For visual evidence, remember:

- automated screenshots/CI do not replace owner judgment;
- keep face/head zones clear;
- keep FIFA-style diagonal energy where requested;
- loading screen remains protected unless explicitly reopened.

### B. Owner asks to advance the roadmap

The next legal substantive feature is:

**Candidate B — Import Analysis + Migration Preview**

Candidate B must remain read-only/dry-run.

It may:

- accept/select a backup file through an accessible input/drop flow;
- enforce input-size limits;
- parse JSON;
- validate backup format/version;
- verify SHA-256 checksum;
- validate payload/schema;
- execute ordered migrations in memory;
- preview duplicates/conflicts;
- summarize active/Legacy/preferences changes;
- show warnings/errors.

It must **not**:

- write to localStorage;
- remove localStorage keys;
- restore automatically;
- merge automatically;
- replace active Showdown;
- become Candidate C;
- introduce profiles/save slots/cloud/PWA.

Candidate C — Atomic Restore and Recovery UX — remains blocked behind Candidate B evidence.

---

## 15. Candidate B architecture boundaries to preserve

If Candidate B is authorized, inherit these locked rules:

- current source is implementation authority;
- `js/storage.js` remains sole persistence authority;
- import analysis must be read-only;
- use ordered deterministic migration stages rather than scattered fixes;
- preserve Showdown IDs as current identity in v1.1;
- do not prematurely implement the v1.3 opaque identity/save-registry redesign;
- future unsupported backup/schema versions fail closed;
- same-ID/different-content conflicts are previewed, not silently resolved;
- malformed input must not damage current storage;
- backup checksum is integrity detection, not authentication/encryption;
- Chromebook/mobile/keyboard/touch/reduced-motion remain first-class;
- startup/performance budgets remain binding;
- lazy module boundaries remain preferred.

Before Candidate B implementation, re-read its detailed section in `POST_V1_ROADMAP_EXECUTION.md` and reconcile it against current `main`, because that roadmap file contains older introductory version labels even though its Candidate B/C technical design remains useful.

---

## 16. Permanent product/gameplay locks

Do not alter these without explicit owner instruction:

- exactly two managers;
- Champions League winner = 5 points;
- domestic league winner = 3 points;
- main domestic cup = 1 point;
- 100 league points / 100 league goals pair = maximum +1 total;
- Top Scorer / Top Assist pair = maximum +1 total;
- maximum season score = 11;
- only 0–0 uses league position, then league points, as tiebreak;
- equal non-zero season scores remain a draw;
- both managers use the same selected league;
- clubs are different;
- clubs are fixed for the Showdown after assignment;
- selected league does not reroll;
- explicit League Selected → Continue → League Confirmed checkpoint remains;
- critical transitions save first and rollback/block on failure;
- Season Review remains nonpersistent until confirmation;
- Smart Back remains centralized;
- Transfer lock/rollback behavior remains authoritative.

---

## 17. Key source ownership

Use these ownership boundaries before changing architecture:

- `js/screens.js` — sole navigation/history authority;
- `js/storage.js` — sole persistence authority;
- `js/showdown.js` — canonical Showdown model;
- `js/scoring.js` — scoring authority;
- `js/analytics.js` — analytics calculations;
- `js/backup.js` — lazy Candidate A backup interpretation/checksum/download, never a second persistence owner;
- `js/optionalModules.js` — optional destination/module loading boundary;
- `js/menuExperience.js` — Home/menu media/experience behavior;
- `js/menuFeedback.js` — lazy original UI feedback synthesis;
- `js/legacy.js` — Legacy/Data Management UI surface.

Current localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema: `2`.

Current preferences schema: `2`.

Do not introduce a new storage authority casually.

---

## 18. Current validation philosophy

A future release is not complete because one summary check is green.

For meaningful runtime work:

1. create a focused branch from current `main`;
2. keep changed scope bounded;
3. run every relevant feature/workstream gate;
4. run Static App and Final Polish;
5. run Licensed Football Visuals for relevant presentation work;
6. run Stability contracts;
7. run the complete Chromium Stability lane;
8. run the five-pass release burn-in when preparing a release candidate;
9. freeze one exact SHA;
10. merge with expected-head protection;
11. require GitHub Pages deployment;
12. require post-merge deployed-site smoke including exact runtime-byte parity;
13. record final proof publicly.

Never make a gate easier merely because it catches a product regression.

If a gate itself is stale, prove why it is stale and replace it with an equal-or-stronger contract.

---

## 19. User communication that must carry forward

The owner has repeatedly instructed developers to:

- build directly in GitHub;
- avoid planning/repetition loops;
- preserve working architecture and completed decisions;
- use full attention/detail rather than superficial patches;
- maintain public handoff files continuously;
- distinguish technical CI proof from owner visual approval;
- keep the FIFA 17 visual inspiration strong;
- use footballers as clean anchors;
- retain diagonal FIFA-style line energy while protecting faces/heads;
- protect the loading screen that the owner likes;
- perform serious maintenance/stability validation before advancing major roadmap features.

Most recent instruction leading to this document:

The owner asked for a complete handoff that details exactly where development stopped so the next developer can reference it.

That is the purpose of this file.

---

## 20. Exact stopping point

At the moment this handoff was written:

- v1.1.0 Candidate A is complete, merged, deployed and technically proven;
- v1.1.0 Clean Stability Build is complete, merged and technically sealed;
- runtime defects found by the clean build: `0`;
- continuation-authority defect found/fixed: `1`;
- runtime application bytes changed by clean stability: `0`;
- fully validated predecessor main SHA: `30ae13435d61a5065a366cc80b15b9db63174510`;
- all twelve permanent workflows on that SHA: `SUCCESS`;
- five-pass release burn-in on that SHA: `5/5 SUCCESS`;
- Stability contracts: `SUCCESS`;
- two-cycle Chromium Stability: `SUCCESS`;
- deployed-site smoke: `SUCCESS`;
- GitHub Pages deployment `5857350485`: `SUCCESS`;
- failed/queued/running push workflows on the validated predecessor: `0 / 0 / 0`;
- PR #15: merged/closed;
- temporary clean-build helper workflows/scripts: none intentionally left;
- Candidate B implementation: not started;
- Candidate C implementation: not started;
- next substantive feature if the owner asks to advance: Candidate B, read-only Import Analysis + Migration Preview.

There is **no unfinished code change to resume** from the clean-stability build.

The next developer should start from current `main`, not from the old clean branch, and wait for/execute the owner's next instruction.

If the next instruction is simply “continue the roadmap,” Candidate B is the next legal implementation.

If the next instruction reports a defect, investigate that defect first and do not begin Candidate B until the release issue is resolved.

---

## 21. Recommended exact first response/action for the next developer

Do not ask the owner to repeat the project.

Internally perform:

1. fetch current `main`;
2. compare it with the fully validated predecessor `30ae13435d61a5065a366cc80b15b9db63174510` to identify any work after this handoff;
3. read `00_DEVELOPER_START_HERE.md`;
4. read `NEXT_TASK.md`;
5. read this handoff;
6. inspect the current source relevant to the owner's new instruction;
7. continue directly from there.

Safe continuation sentence:

> Project loaded from current main. v1.1.0 Candidate A and the clean-stability seal are complete; there is no unfinished clean-build code. I am continuing from the owner's newest instruction, with Candidate B remaining the next legal roadmap feature unless new defect evidence takes priority.

---

## 22. Detailed chronology references

Use these only when deeper archaeology is needed:

- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_V1.1.0_CANDIDATE_A.md`
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_V1.1.0_CLEAN_STABILITY_BUILD.md`
- `RELEASE_V1.1.0.md`
- `PROJECT_STATE.md`
- `POST_V1_ROADMAP_EXECUTION.md`
- earlier `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION*.md` history files.

This document should be sufficient for the immediate current stop. The deeper files exist for why/how decisions were reached.
