# Career Mode Showdown — v1.1.2 Candidate B Handoff Continuation

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/v1.1.2-candidate-b-import-analysis`
Read after: `CAREER_MODE_SHOWDOWN_V1.1.2_CANDIDATE_B_HANDOFF.md`
Permanent owner rule: `00_HANDOFF_GOLDEN_RULE.md`

This file is the active continuation handoff from the point where the first handoff stopped after the second pre-publication guarded-integration failure. It exists so no intervening failure, correction, successful test, visual observation, validator promotion, PR/merge/deployment evidence or next action is lost if this session is interrupted.

## Third guarded integration attempt — conflicting duplicate test expectation

Temporary workflow:

`Candidate B Guarded Integration Final`

Run:

`31544488831`

Result:

`FAILED DURING CANDIDATE B DETERMINISTIC CONTRACTS — NO GENERATED RUNTIME COMMITTED`

Successful evidence before failure:

- generator and structural hardening succeeded;
- JavaScript syntax and lockfile reinstall succeeded;
- Stability contracts passed for v1.1.2 / 1.1.2-r1;
- Candidate A backup/storage contracts passed;
- Candidate B migration/preferences correction from the prior run passed.

Exact failure classification:

`CONTRADICTORY SAME-ID FIXTURE ASSERTION — STRICT CONFLICT BLOCKING CORRECT — NO PRODUCT DEFECT ESTABLISHED`

The fixture contained three imported Legacy records with the same Showdown ID: two byte-equivalent records plus a third record with different content/revision. Candidate B intentionally treats any same-ID group containing differing content as one unresolved conflict group and blocks the analysis from advancing toward a later restore stage. The test already proved the blocking error. Its additional expectation that the same group must simultaneously retain an exact-duplicate warning was contradictory.

Recovery:

- preserve the stricter production behavior;
- remove only the contradictory exact-duplicate-warning assertion;
- do not weaken same-ID conflict blocking.

No generated Candidate B runtime was published from this failed attempt.

## Fourth guarded integration attempt — startup budget gate

After correcting only the contradictory test assertion, the same complete integration workflow reran as:

`31544558663`

This run passed all deterministic contracts:

- Stability contracts;
- Candidate A backup/storage contracts;
- Candidate B import-analysis contracts;
- final release hardening contracts.

The next unchanged startup-budget gate then failed with:

- eager raw bytes: `165,083`;
- raw limit: `165,000`;
- eager gzip bytes: `36,955`;
- gzip limit: `37,500`.

Classification:

`UNCHANGED STARTUP RAW BUDGET BREACH — CANDIDATE B LAZY HOOK 83 BYTES OVER RAW LIMIT — GZIP GREEN`

This was treated as a real quality gate, not permission to raise the budget.

Root cause:

Candidate B itself remained lazy and was not part of the initial shell. The only meaningful eager growth was the readiness predicate added to `js/optionalModules.js` for loading the lazy Candidate B module. The original predicate redundantly checked three exports after the same synchronous script execution.

Recovery:

- preserve `165,000` raw and `37,500` gzip limits unchanged;
- keep `js/importAnalysis.js` lazy;
- reduce the eager readiness predicate to one stable sentinel, `analyzeCareerModeBackupFile`, while permanent contracts/browser tests independently verify the envelope-analysis and mount exports;
- rerun the complete integration from the beginning.

No threshold was raised and no feature was moved into the eager shell.

## Successful guarded integration and generated runtime publication

After the loader compaction, complete guarded integration run:

`31544710189 — SUCCESS`

Successful evidence:

### Deterministic / data-safety contracts

- Stability contracts — PASS;
- Candidate A backup/storage contracts — PASS;
- Candidate B import-analysis contracts — PASS;
- final release hardening contracts — PASS.

Candidate B contracts include:

- source-level no `localStorage.setItem()` ownership;
- source-level no `localStorage.removeItem()` ownership;
- no `fetch()` / XMLHttpRequest network path;
- Showdown schema 1→2 migration;
- preferences schema 1→2 migration;
- migration input non-mutation;
- migration idempotence;
- current schema validation;
- unsupported future format rejection;
- unsupported future schema rejection;
- checksum mismatch rejection;
- envelope-count mismatch rejection;
- malformed JSON rejection;
- oversized File rejection before `File.text()`;
- forbidden `__proto__` structure rejection and prototype-pollution proof;
- same-ID conflicting records inside one backup blocking;
- corrupt current raw local bytes preserved byte-for-byte;
- 1,500-record large-input analysis responsiveness;
- exact local-storage write/remove counters remaining unchanged during preview.

### Startup budgets

Final successful unchanged budget evidence:

- eager raw: `164,960` bytes ≤ `165,000`;
- eager gzip: `36,935` bytes ≤ `37,500`;
- initial asset count remains 8;
- `js/importAnalysis.js` is absent from eager shell references.

### Browser / runtime evidence

The same successful run executed:

- runtime error provenance audit — PASS;
- Home / Marco Reus desktop + mobile audit — PASS;
- full licensed football-photo audit — PASS;
- Candidate A backup/export browser audit — PASS;
- Candidate B import-analysis browser audit — PASS;
- complete public-style gameplay/navigation browser journey — PASS.

Candidate B browser audit proved:

- 940×700 desktop/windowed Data Management path;
- 390×844 DPR2 touch/mobile + reduced-motion path;
- Candidate A export → Candidate B analysis round-trip;
- keyboard Enter analysis path;
- drag/drop file path;
- touch/tap path;
- checksum tamper blocked;
- malformed JSON blocked;
- future format blocked;
- >5 MiB input blocked;
- exact canonical active/Legacy/preferences bytes unchanged;
- Storage.prototype instrumentation observed zero setItem and zero removeItem calls during analysis;
- no Restore/Apply control exists;
- axe violations = zero;
- horizontal overflow = zero;
- mobile interactive targets meet the intended size gate.

The protected full journey completed 70 checkpoints and 36 axe scans with zero unhandled app exceptions.

Generated runtime/source commit:

`29929be626d6c19ee5d5e0181960424e3fdffdcf`

Message:

`Implement v1.1.2 Candidate B import analysis [candidate-b-generated]`

The one-shot generator/helper files were removed before that generated-source commit. The successful temporary integration workflow was removed in follow-up commit `c198cc77dd77c5642e0304ad36330f1ace7e8c4f`.

## Manual integration screenshot review

Successful integration artifact:

`9122082648`

The artifact was downloaded and manually inspected after machine gates.

Desktop Candidate B screenshot:

- Data Management hierarchy is clear;
- Preview Only / No Restore Writes is visible before the heading;
- import purpose is understandable;
- oversize rejection is visually explicit and does not look like a successful restore;
- blocking message states no browser data changed;
- layout remains inside the 940px viewport.

Mobile Candidate B screenshot:

- Preview Ready state is legible;
- checksum verification is clearly distinguished from restore state;
- Candidate C restore remains explicitly unavailable;
- the drop target and Analyze/Clear controls have strong touch sizing;
- no horizontal overflow is visible.

Manual inspection found one UX detail not caught as a functional failure: after a drag/drop selection, the browser-native file input still visually says `No file chosen` even though Candidate B correctly shows `dropped-backup.json` in its own live file-state line. Browsers do not allow arbitrary synchronization of the native file picker value after drag/drop. The dual display is technically correct but visually contradictory/confusing.

Decision:

Before freezing the PR candidate, hide the redundant native file-input chrome visually while preserving it for programmatic picker/file-selection ownership, and keep the accessible/touch-sized dropzone as the user-facing Choose/Drop control. Update the browser test so it measures the actual user-facing dropzone/action targets rather than a visually hidden native input. Then rerun Candidate B changed-surface browser/accessibility evidence.

## Permanent validation matrix promotion

The initial successful integration staged the new/changed workflow bodies outside `.github/workflows` because Actions cannot safely publish workflow definitions through its default contents token in this repository. The authenticated GitHub connector was used to promote the exact generated blob identities.

Promoted Candidate B/current-release workflow authorities:

- new `validate-import-analysis.yml`;
- `validate-stability-lane.yml` with Candidate B in both repeated Chromium cycles and deployed-site smoke;
- `validate-v110-release-burnin.yml`, now named v1.1.2 and running Candidate B in every one of five independent passes;
- `validate-static-app.yml`, aligned to v1.1.2 while preserving v1.1.1/v1.1.0 historical release evidence.

The successful integration's reference audit also exposed five permanent validators whose live cache/version checks still pinned v1.1.1:

- Home Bootstrap;
- Season Review;
- Statistics Workstream;
- Final Polish;
- V1 Visual Immersion.

These were treated as stale current-release assertions only. No feature/visual threshold was weakened.

First validator-coherence staging run:

`31545065724 — FAILED`

Classification:

`VALIDATOR-STAGING HELPER QUOTE-ESCAPE MATCH FAILURE — NO WORKFLOW BLOB PUBLISHED`

The helper looked for literal backslashes around `APP_VERSION` quotes inside the V1 Visual Immersion validator, while the actual workflow contains ordinary double quotes inside a single-quoted JavaScript string. No workflow file was modified.

Corrected validator-coherence staging run:

`31545133997 — SUCCESS`

The corrected staged blobs advanced only current runtime/cache assertions from v1.1.1 to v1.1.2 and preserved protected behavior/source assertions.

Atomic permanent-validator promotion commit:

`6a985b640d63a07f2f682501491f64b732a66f43`

This commit promoted all nine intended workflow blobs and removed all staged workflow copies plus the temporary coherence workflow in one tree update.

## Current status

`CANDIDATE B RUNTIME IMPLEMENTED — INTEGRATION GREEN — STARTUP BUDGET GREEN — PERMANENT VALIDATORS PROMOTED — MANUAL UX CLEANUP BEFORE PR FREEZE`

## Immediate next action

1. hide redundant native file-input chrome without removing the accessible picker ownership;
2. update the Candidate B browser target-size assertion to the user-facing dropzone/actions;
3. rerun Candidate B deterministic + browser/accessibility evidence;
4. update this handoff with the result;
5. inspect final branch diff for protected-system drift;
6. open PR and run the complete permanent matrix on one frozen SHA;
7. merge only after exact green evidence, then deploy Pages and run production Candidate B + Stability verification;
8. record exact PR/merge/deploy evidence here before presenting the build to the owner.
