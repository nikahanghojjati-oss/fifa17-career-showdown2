# Career Mode Showdown — v1.1.2 Candidate B Release Handoff

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/v1.1.2-candidate-b-import-analysis`
Base main: `c86d8d36285295899e8473539c33d6f7b34b4226`
Application: `v1.1.2`
Runtime revision: `1.1.2-r1`

Read after:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `CAREER_MODE_SHOWDOWN_V1.1.2_CANDIDATE_B_HANDOFF.md`
3. `CAREER_MODE_SHOWDOWN_V1.1.2_CANDIDATE_B_HANDOFF_CONTINUATION.md`

This is the active release-stage handoff. The prior two handoffs preserve implementation design, every pre-publication failure/correction, successful guarded integration, manual screenshot findings, workflow-staging incidents and validator promotion. This file starts from the final implementation/polish state immediately before PR diagnostics.

## Golden rule remains active

The owner requires continuous public handoff recording because a developer session can be interrupted without warning. Do not hide failures, rejected evidence, flaky infrastructure, threshold breaches, corrections, merge/deployment state or owner-acceptance state.

During a frozen candidate proof the SHA must not be changed merely to append CI results. Exact workflow/PR evidence remains publicly visible in GitHub Actions/PR metadata while the SHA is frozen. After diagnostic evidence, this handoff may be updated once before the official freeze; that handoff-inclusive SHA must then earn the complete official proof. Post-merge production evidence must be written back into a public handoff before the build is presented to the owner.

## Candidate B final implementation boundary

Candidate B is a read-only import-analysis layer in the existing lazy Data Management surface.

Implemented:

- local JSON file selection through one visible choose/drop zone;
- drag/drop, keyboard and touch interaction;
- 5 MiB maximum File size, rejected before `File.text()` when File metadata is available;
- strict JSON parsing;
- exact Candidate A backup `formatId` / `formatVersion` validation;
- SHA-256 checksum verification using Candidate A canonicalization authority;
- hostile object-key rejection before canonicalization;
- excessive nesting / structure-size protection;
- Showdown and preferences current-schema validation;
- ordered Showdown schema 1→2 migration;
- ordered preferences schema 1→2 migration;
- deterministic, non-mutating and idempotent migration contracts;
- unsupported future backup/data schemas fail closed;
- Showdown ID comparison as persisted strings;
- conflict categories: new, exact duplicate, same ID/same effective revision, same ID/different revision, malformed/unresolvable;
- conflicting duplicate IDs inside one backup block analysis rather than silently resolving;
- active Showdown impact preview;
- Legacy impact preview;
- application preference impact preview;
- corrupt current local raw bytes preserved and surfaced as warnings;
- Candidate A export → Candidate B analysis round-trip;
- explicit Preview Only / No Restore Writes messaging;
- `readyForRestore:false` by construction;
- no Restore/Apply control;
- no network request;
- zero canonical localStorage writes/removals.

Explicitly excluded:

- restore/apply writes;
- automatic active replacement;
- automatic Legacy merge/dedupe;
- raw-recovery-byte application;
- Candidate C rollback/transaction UX;
- profile/save-library redesign;
- PWA/service worker;
- cloud/account/two-device work.

Candidate C remains the first legal stage allowed to write imported canonical state.

## Data-safety architecture

Persistence ownership remains unchanged:

- `js/storage.js` is still the sole persistence authority;
- Candidate B does not modify `js/storage.js`;
- Candidate B reads current raw state only through `captureCareerModeRawBackupInputs()`;
- current localStorage key names and schema remain unchanged.

Candidate A ownership remains:

- `js/backup.js` owns backup envelope/checksum creation and verification;
- its canonical object accumulator changed from `{}` to `Object.create(null)` because Candidate B now passes user-selected JSON through checksum canonicalization;
- valid JSON canonicalization ordering and checksum bytes remain unchanged;
- SHA-256 remains corruption detection, not authentication/trusted-origin proof.

Candidate B analysis ownership:

- `js/importAnalysis.js` owns parsing, structure validation, migration, conflict analysis and preview-only UI;
- it performs no `fetch()` / XMLHttpRequest;
- it contains no canonical localStorage set/remove operation;
- one ordered migration registry prevents scattered migration behavior.

## Startup/performance result

Candidate B remains lazy.

The unchanged release budgets remain:

- eager raw limit: `165,000` bytes;
- eager gzip limit: `37,500` bytes.

A real pre-publication gate caught the first candidate at `165,083` raw bytes, 83 bytes over the raw limit. The limit was not raised.

Final successful guarded-integration startup result:

- eager raw: `164,960` bytes;
- eager gzip: `36,935` bytes;
- eager asset count: 8;
- `js/importAnalysis.js` absent from eager shell.

The recovery only compacted the redundant lazy-module readiness predicate. Candidate B functional/browser contracts independently verify the full analysis/mount surface.

## Successful guarded integration

Run:

`31544710189 — SUCCESS`

Generated runtime/source commit:

`29929be626d6c19ee5d5e0181960424e3fdffdcf`

This run passed:

- Stability contracts;
- Candidate A backup/storage contracts;
- Candidate B import-analysis contracts;
- final release hardening;
- unchanged startup raw/gzip budgets;
- runtime error provenance;
- Home / Marco Reus visual audit;
- licensed football-photo audit;
- Candidate A backup/export browser audit;
- Candidate B import-analysis browser audit;
- complete gameplay/navigation browser journey.

The full protected journey completed 70 checkpoints and 36 axe scans with zero unhandled app exceptions.

Candidate B deterministic evidence included hostile JSON structure, checksum tampering, malformed JSON, wrong/future format, future data schema, envelope-count mismatch, migration idempotence/input non-mutation, conflicting IDs, corrupt local bytes, a 1,500-record large input, and exact zero-write instrumentation.

Integration screenshot artifact:

`9122082648`

## Manual Data Management review and final UI cleanup

Manual review of the successful integration artifact identified one visual contradiction after drag/drop: browser security prevents programmatically making a native `<input type=file>` display a dropped filename, so the native control still showed `No file chosen` while Candidate B's own live state correctly showed `dropped-backup.json`.

This was not accepted as release polish.

Correction:

- retain the native file input as programmatic picker ownership;
- visually hide its redundant browser chrome using the standard clipped-accessible-input pattern;
- keep the large visible dropzone as the user-facing choose/drop control;
- keep filename/size in Candidate B's live state;
- move touch-size assertions to actual visible interactive controls.

Cleanup validation run:

`31545416320 — SUCCESS`

Validated cleanup commit:

`7fb44453d3045a46cf378f3e5b7000ccf5061d56`

Temporary cleanup workflow removal:

`9917350ee7dbc5c4fc774d422771d2b7b5034cf4`

Cleanup artifact:

`9122280281`

Cleanup evidence passed:

- Candidate B deterministic import contracts;
- Candidate A Data Management browser audit;
- Candidate B Data Management browser audit;
- axe accessibility;
- desktop/windowed path;
- DPR2 mobile/touch/reduced-motion path;
- drag/drop;
- zero-write instrumentation;
- touch target sizing.

Manual cleanup screenshot review:

- redundant `No file chosen` chrome is gone;
- visible dropzone remains clear;
- dropped filename/size remains visible;
- Preview Ready / Analysis Blocked state is unambiguous;
- checksum state is visible without implying authentication;
- Candidate C restore remains explicitly unavailable;
- no horizontal overflow is visible.

## Permanent gate matrix

Candidate B adds a thirteenth permanent family:

1. Home Bootstrap
2. League Confirmation
3. Transfer Workstream
4. Season Review
5. Statistics Workstream
6. Settings Workstream
7. V1 Visual Immersion
8. Licensed Football Visuals
9. Final Polish
10. Static App
11. Stability Lane
12. v1.1.2 Release Burn-In
13. Candidate B Import Analysis

Candidate B Import Analysis permanent workflow:

- deterministic import/migration/conflict/no-write contracts;
- two consecutive real-browser Candidate B analyses in its browser job;
- uploaded desktop/mobile Data Management screenshots.

Stability now includes Candidate B inside each of two consecutive complete browser cycles and again in deployed-site smoke.

Release Burn-In remains five independent complete release-gate jobs, and Candidate B browser analysis runs inside every one.

No old quality/performance/accessibility threshold was lowered.

## Validator-coherence incidents and final promotion

Successful integration identified stale current-release v1.1.1 pins in five pre-existing validators. Historical release/source facts were not rewritten.

First staging run:

`31545065724 — FAILED`

Classification:

`VALIDATOR-STAGING HELPER QUOTE-ESCAPE MATCH FAILURE — NO WORKFLOW BLOB PUBLISHED`

Corrected staging run:

`31545133997 — SUCCESS`

Atomic permanent-validator promotion commit:

`6a985b640d63a07f2f682501491f64b732a66f43`

Promoted current-release workflow authority includes:

- new Candidate B Import Analysis;
- Stability Candidate B integration;
- v1.1.2 five-way Burn-In;
- Static App v1.1.2/current-release alignment;
- Home Bootstrap v1.1.2 cache identity;
- Season Review v1.1.2 cache identity;
- Statistics v1.1.2 cache identity;
- Final Polish v1.1.2 cache identity;
- V1 Visual Immersion v1.1.2 cache/application identity.

Protected visual/source behavior assertions remain intact.

## Protected-system diff audit before PR

Base:

`c86d8d36285295899e8473539c33d6f7b34b4226`

Audited implementation head before this release handoff:

`9917350ee7dbc5c4fc774d422771d2b7b5034cf4`

The final diff does NOT include:

- `js/storage.js`;
- `js/scoring.js`;
- `js/screens.js`;
- `js/showdown.js`;
- Transfer state implementation;
- `js/seasonEngine.js`;
- `data/footballVisuals.js`;
- any football-player image binary.

Therefore Candidate B introduces no intentional change to:

- max-11 scoring;
- 0–0-only tiebreak;
- exactly-two-manager model;
- League confirmation;
- Club Assignment transaction/reveal semantics;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- canonical route authority;
- storage keys/schema;
- football-photo source authority.

`js/footballVisuals.js` and `js/menuExperience.js` only advance coherent runtime cache identity from `1.1.1-r1` to `1.1.2-r1`; source/composition authority is unchanged.

## PR proof strategy

The first complete PR matrix is diagnostic. Its purpose is to expose stale assertions, race conditions, environment differences or real product defects after all permanent validators have been promoted.

After diagnostic evidence:

- any real defect is fixed without weakening gates;
- this handoff is updated with exact diagnostic evidence;
- that handoff-inclusive SHA becomes the official frozen candidate;
- all 13 permanent families must pass on the frozen SHA;
- all 13 families are then executed a second independent time on the exact same SHA;
- any runtime/source change resets the official proof;
- merge uses expected-head protection;
- GitHub Pages must deploy exact merge bytes;
- Candidate B and the complete Stability deployed journey must pass on public Pages before release closure.

## Current status

`IMPLEMENTATION + POLISH GREEN — PROTECTED DIFF CLEAN — RELEASE HANDOFF CREATED — PR DIAGNOSTIC MATRIX NEXT`

## Immediate next action

Open the v1.1.2 Candidate B PR from the current branch, run all 13 permanent families as a diagnostic matrix, record exact results, then freeze the handoff-inclusive candidate for official double execution.
