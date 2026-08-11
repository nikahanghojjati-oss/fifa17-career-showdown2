# Career Mode Showdown — v1.1.2 Candidate B Public Handoff

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/v1.1.2-candidate-b-import-analysis`
Base main: `c86d8d36285295899e8473539c33d6f7b34b4226`

## GOLDEN RULE — continuous public handoff logging

The owner explicitly requires every development session to record meaningful work continuously in a public repository handoff because a ChatGPT/developer session may be interrupted without warning.

This rule is non-negotiable for every future developer:

- create or identify the active public handoff before meaningful implementation begins;
- record the owner instruction that defines the active task;
- record branch/base/runtime authority;
- record design decisions and why they were made;
- record every meaningful implementation step;
- record failed experiments, CI failures and exact classifications instead of hiding them;
- record corrective commits and why they are safe;
- record exact frozen candidate SHA, PR, merge SHA and deployment evidence;
- record gate results and any rejected/non-counted evidence;
- record owner acceptance/rejection state separately from developer/CI acceptance;
- record the immediate legal next action before ending a session;
- update the handoff during the build, not only after completion.

A future developer must prefer an incomplete-but-current handoff over reconstructing intent from old chat chronology.

## Owner instruction for this build

The owner instructed the developer to work through the next build completely without stopping midway to ask for continuation, apply extensive and accurate gate checks, build/test until all gates are green, deploy the finished build, and then present the result. The owner reiterated that complete continuous public handoff recording is the golden rule and asked for that requirement to be made visible to future developers in repository authority.

## Starting authority

Current technical baseline before Candidate B:

- application: `v1.1.1`;
- runtime revision: `1.1.1-r1`;
- current main: `c86d8d36285295899e8473539c33d6f7b34b4226`;
- v1.1.1 runtime implementation authority: `29caae874bf00deba89bdb1ffcfc0654ead3928f`;
- Candidate A backup envelope/export: complete, deployed and protected;
- Candidate B import analysis/migration preview: not implemented at branch creation;
- Candidate C atomic restore: blocked behind Candidate B and explicitly out of scope;
- v1.2.0 remains reserved for Installable Offline App.

This substantive runtime feature is being developed as `v1.1.2` so the v1.2.0 roadmap reservation remains intact.

## Candidate B scope lock

Candidate B must read a user-selected backup in isolation and explain what would happen without mutating canonical local data.

Included:

- accessible file selection and drag/drop path where appropriate;
- strict file-size ceiling before expensive parsing;
- strict JSON parse;
- backup format ID/version validation;
- SHA-256 checksum verification using Candidate A canonicalization authority;
- active Showdown / Legacy / preferences validation;
- supported historical-schema migrations through one ordered registry;
- rejection of unsupported future backup/data schemas;
- duplicate/conflict classification using existing Showdown IDs as strings;
- dry-run preview of active/Legacy/preferences effects;
- clear warnings/errors and inspectable analysis details;
- deterministic fixtures and browser coverage;
- zero canonical localStorage writes/removals.

Explicitly excluded:

- restore/apply writes;
- automatic merge;
- silent active replacement;
- profile/save-library identity redesign;
- PWA/service worker;
- cloud/account/network upload;
- Candidate C rollback/commit UI.

## Quality/gate philosophy for this build

Candidate B is a data-safety boundary, so green UI smoke alone is insufficient. Gates must prove structural invariants, security/failure behavior and non-mutation.

Planned changed-surface evidence:

1. zero-write instrumentation around every analysis path;
2. strict maximum input bytes before `File.text()`/parse when file metadata is available;
3. malformed JSON, wrong format, unsupported future format and checksum mismatch rejection;
4. supported current and historical schema fixtures;
5. deterministic ordered migration registry and idempotence checks;
6. no mutation of caller-owned parsed backup objects during migration/analysis;
7. duplicate and conflict classification with same-ID/exact/same-effective-revision/different-revision cases;
8. malformed/unresolvable-record accounting rather than silent drops;
9. dry-run preview explaining active replacement impact, Legacy additions/conflicts/duplicates and preference changes;
10. large-but-allowed input responsiveness and oversized rejection;
11. accessibility/keyboard/touch/Chromebook/mobile behavior;
12. lazy loading so startup budgets remain protected;
13. Candidate A export round-trip into Candidate B analysis;
14. protected gameplay/storage/visual regression matrix;
15. exact Pages byte parity and complete deployed journey after merge.

No existing quality, startup, accessibility or performance threshold may be lowered just to obtain green CI.

## Implementation design checkpoint

Candidate B architecture selected before runtime publication:

- `js/importAnalysis.js` is a new lazy, read-only analysis/migration/UI module loaded only with Legacy/Data Management.
- `js/backup.js` remains Candidate A checksum authority; its canonical object accumulator will use a null-prototype object because Candidate B now verifies user-supplied JSON. Valid checksum bytes remain unchanged.
- `js/storage.js` remains untouched as persistence authority; Candidate B reads only through `captureCareerModeRawBackupInputs()`.
- one explicit ordered migration registry owns Showdown schema 1→2 and preferences schema 1→2; no scattered import normalization is allowed.
- migration functions clone input, are tested non-mutating and idempotent, and fail closed on unsupported future schemas.
- conflict comparison follows current storage precedent: Showdown IDs are compared as strings and effective revision uses `updatedAt` + `completedAt`.
- the Data Management UI contains no Restore/Apply action and explicitly states Preview Only / No Restore Writes.
- file size ceiling is 5 MiB and oversized File objects are rejected before `File.text()`.
- Candidate B performs no network request.
- exact deployment verifier hash/length authority remains unchanged; only bounded retry for transient transport is planned after the recorded v1.1.1 one-file `fetch failed` incident.

New permanent evidence is designed to include golden schema fixtures, deterministic import contracts, a dedicated real-browser Candidate B audit, a dedicated permanent workflow, integration into two-cycle Stability, and integration into every five-way Release Burn-In pass.

## First guarded integration attempt

Temporary workflow run:

`31544138146 — Candidate B Guarded Integration`

Result:

`FAILED BEFORE RUNTIME PUBLICATION`

Exact failure classification:

`POST-GENERATION GUARD MATCH FAILURE — GENERATOR SUCCEEDED — NO GENERATED RUNTIME COMMITTED`

Evidence:

- dependency installation succeeded;
- `tools/apply_v112_candidate_b.py` executed successfully and generated its local candidate tree;
- the next hardening step intentionally stopped because an indentation-sensitive literal expected for `isPlainImportObject()` did not match the generated indentation;
- syntax, contracts, browser tests, startup budgets and publication were therefore skipped rather than falsely counted;
- no generated Candidate B application/runtime file from that run was pushed to the branch;
- the failed temporary workflow was removed in commit `582960c555a272a2ceba09b83a9a29a9e47d08d8`.

This is an integration-helper defect, not a Candidate B product failure. Recovery is to use a structural/regex post-generation guard rather than whitespace-sensitive source matching, then rerun the complete guarded integration from the generator.

## Second guarded integration attempt

Temporary workflow run:

`31544312802 — Candidate B Guarded Integration Retry`

Result:

`FAILED DURING NEW DETERMINISTIC CONTRACTS — NO GENERATED RUNTIME COMMITTED`

Successful evidence before failure:

- generator succeeded;
- structural cross-realm hardening succeeded;
- compact lazy-loader/startup-budget hardening succeeded;
- current v1.1.2 Static App validator alignment succeeded locally;
- generated JavaScript syntax checks succeeded;
- package lock reinstall succeeded;
- existing Stability contracts passed for `v1.1.2 / 1.1.2-r1`;
- Candidate A backup/storage contracts passed unchanged.

Exact failure:

Candidate B contract expected `analysis.preview.preferences.kind === "change"`, but actual was `"no-change"`.

Classification:

`TEST FIXTURE SEMANTIC ERROR — ANALYZER CORRECTLY REPORTED IDENTICAL MIGRATED PREFERENCES — NO PRODUCT DEFECT ESTABLISHED`

Root cause:

- current local preferences in the fixture were `{schemaVersion:2,reducedMotion:false,menuFeedback:true}`;
- imported schema-1 fixture was deliberately overwritten to `reducedMotion:false` before envelope signing;
- the schema-1→2 migration correctly produced `{schemaVersion:2,reducedMotion:false,menuFeedback:true}`;
- therefore Candidate B correctly classified preferences as `no-change`;
- the test assertion was wrong because the fixture did not actually differ.

Recovery:

Change only the test matrix input so imported schema-1 preferences remain `reducedMotion:true`, creating a real preference delta while preserving the production analyzer. Then rerun generation and the complete integration from the beginning.

The failed retry workflow was removed in commit `173460676b72960a22b079f3797e44864a7dc3f7`. No generated Candidate B runtime was pushed from this attempt.

## Action log

1. Confirmed current main `c86d8d36285295899e8473539c33d6f7b34b4226` and read current `00_DEVELOPER_START_HERE.md`, `NEXT_TASK.md`, and Candidate B/C dependency sections of `POST_V1_ROADMAP_EXECUTION.md`.
2. Confirmed Candidate B is the next substantive legal milestone and Candidate C remains blocked.
3. Created branch `agent/v1.1.2-candidate-b-import-analysis` directly from current main.
4. Created this public handoff before implementation mutation.
5. Added permanent owner policy `00_HANDOFF_GOLDEN_RULE.md` in commit `29514ea777b553fdfcabec764f0d0d25754a9c72` so future developers know continuous public handoff logging is mandatory.
6. Inspected Candidate A backup, storage, Legacy/Data Management, optional module, browser audit, Stability and Burn-In authorities.
7. Selected v1.1.2 for Candidate B so roadmap v1.2.0 remains reserved for Installable Offline App.
8. Staged guarded generator `tools/apply_v112_candidate_b.py` in commit `128505b891a8303dfc86d090b3d1fa86224c1f69`.
9. Added first temporary guarded integration workflow in commit `d207c0aa3467520b7935d22865be7d1e37e4d027`.
10. Run `31544138146` stopped safely at the whitespace-sensitive hardening guard; no generated runtime was published and no later gate was counted.
11. Removed that failed temporary workflow in commit `582960c555a272a2ceba09b83a9a29a9e47d08d8`.
12. Added structural-guard retry workflow in commit `bb8f53b1a1adbf90c03ab4d5ddf00923552b4d15`.
13. Run `31544312802` passed generation/syntax/existing contracts, then correctly exposed a Candidate B preference-delta fixture that was semantically identical to local data while the assertion expected a change.
14. Removed the second temporary workflow in commit `173460676b72960a22b079f3797e44864a7dc3f7`.
15. Next: correct only the imported preference fixture delta and rerun the complete guarded integration. No production analyzer change is justified by this failure.

## Current status

`CANDIDATE B GENERATOR READY — TWO PRE-PUBLICATION INTEGRATION FAILURES RECORDED — FIXTURE-CORRECT RETRY NEXT`

## Implementation design checkpoint

Candidate B architecture selected:

- `js/importAnalysis.js` is a new lazy, read-only analysis/migration/UI module loaded only with Legacy/Data Management.
- `js/backup.js` remains Candidate A checksum authority; its canonical object accumulator is hardened to a null-prototype object because Candidate B now verifies user-supplied JSON. Valid checksum bytes remain unchanged.
- `js/storage.js` remains untouched as persistence authority; Candidate B reads only through `captureCareerModeRawBackupInputs()`.
- one explicit ordered migration registry owns Showdown schema 1→2 and preferences schema 1→2; no scattered import normalization is allowed.
- migration functions clone input, are tested non-mutating and idempotent, and fail closed on unsupported future schemas.
- conflict comparison follows current storage precedent: Showdown IDs are compared as strings and effective revision uses `updatedAt` + `completedAt`.
- the Data Management UI contains no Restore/Apply action and explicitly states Preview Only / No Restore Writes.
- file size ceiling is 5 MiB and oversized File objects are rejected before `File.text()`.
- Candidate B performs no network request.
- exact deployment verifier hash/length authority is retained; only bounded retry for transient fetch transport is added after the v1.1.1 recorded transport-noise incident.

New permanent evidence includes golden schema fixtures, deterministic import contracts, dedicated real-browser Candidate B audit, a dedicated permanent workflow, integration into two-cycle Stability, and integration into every five-way Release Burn-In pass.

Current implementation status after generator application: source/test generation pending workflow execution.
