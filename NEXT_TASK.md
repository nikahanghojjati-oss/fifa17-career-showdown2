# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-13 ET

Application version: v1.2.0
Production runtime asset revision: `1.2.0-r2`
Previous known-good runtime: `1.2.0-r1`
Production state: merged, deployed, exact-byte verified and production-proven
Production proof: `V1.2.0_R2_PRODUCTION_PROOF.md`
Next milestone: v1.3.0 — Recovery & Device Resilience Hardening

## Immediate legal task

Begin v1.3.0 Recovery & Device Resilience Hardening from current verified `main` / `1.2.0-r2`.

Do not begin by implementing new features. First establish the exact current source state and audit the existing draft PR #37 (`agent/v13-hardening`) against current main. Source code is implementation authority when docs or old branches disagree.

PR #37 is not a safe baseline merely because it is named v1.3. Its last inspected head is `221212a87cc58712a1ebd9452d7b71cdaa36327d`. The branch contains a known shell regression introduced by `6ce7fe6fab87031b69e3dc5e98587fd3f78b3558`, which replaced protected production DOM structure while existing JS/CSS still depended on it. This produced menu initialization/visibility failures and version-coherence problems. Do not merge, deploy or blindly continue that shell.

The first v1.3 action is therefore:

1. verify the latest `main` head and public runtime;
2. read `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md` and this file;
3. fetch PR #37 metadata, changed files, diff and CI state;
4. compare PR #37 against current r2 main, not its old base;
5. classify each PR #37 change as useful hardening, stale/conflicting, shell regression, test-only, documentation-only or release-identity work;
6. preserve useful evidence-backed hardening only after separating it from the accidental shell replacement;
7. make the smallest coherent corrections and add focused regression proof;
8. keep the repository handoff current as work proceeds.

Do not migrate the whole app to the accidental alternate PR #37 shell unless the owner explicitly requests a redesign.

## v1.2.0-r2 Installable Offline App production baseline that must be preserved

The just-shipped hotfix fixed:

- iOS standalone loading composition by separating viewport/safe-area behavior from the Reus art composition and locking settled composition geometry;
- install UI hierarchy by removing the global floating install/status presentation and moving install/update actions into Settings only.

The hotfix passed all 13 normal PR workflow families twice. Production Stability `31740111919`, deployed-site-smoke job `94581704562`, dedicated V1 Visual Immersion `31740111961`, and Burn-In `31740111986` are green. Burn-In passed 2/2 complete stateful journeys.

Do not reintroduce global floating/sticky install UI. Do not weaken the new loading composition tests or replace relationship-based visual assertions with existence-only checks.

## v1.3 audit scope

Investigate and fix evidence-backed defects in:

- browser close/reopen, reload, Service Worker controller change and update interruption;
- failed Service Worker population/activation and deterministic recovery;
- current/previous cache corruption and whole-shell selection;
- exact preservation of all three canonical raw localStorage values through lifecycle failures;
- storage blocked-read/write/quota/corrupt-data behavior;
- Candidate C interruption, stale-state handling, ownership uncertainty and rollback verification;
- Settings/offline/update UI layering, focus, pointer, keyboard/touch and reduced-motion safety;
- Smart Back and lazy-screen/listener ownership;
- Chromebook low-height, mobile, DPR2 and accessibility behavior;
- external-media offline/online transitions;
- dependency-lock integrity and reproducible `npm ci`;
- CI ownership, cancellation and artifact semantics;
- version/revision/release/handoff coherence;
- performance headroom without raising protected ceilings.

Known potentially useful PR #37 ideas that must be revalidated against current r2 source include: fail-closed Candidate A behavior on blocked canonical storage reads, preserving true pre-offline media state across repeated offline renders, arming reload intent before waiting-worker activation, avoiding redundant Service Worker registration on the same scope, and semantic roadmap/dependency contracts.

## Protected systems

Do not alter without explicit owner direction:

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league / different permanent clubs;
- maximum Season score 11 and 0–0-only tiebreak;
- League and Club confirmation checkpoints;
- Transfer Challenge and Season Review state machines;
- Statistics/Legacy/Trophy calculations;
- centralized Smart Back/navigation ownership in `js/screens.js`;
- exactly three canonical localStorage keys and `js/storage.js` mutation authority;
- Candidate A non-mutating export;
- Candidate B strictly read-only analysis;
- Candidate C immutable confirmed intent, strict exact raw snapshot/preconditions, last-moment prewrite checks, transaction-owned rollback, byte-for-byte verification and anti-clobber semantics;
- accepted Home/loading intent and licensed football image archive;
- startup budgets and local-first behavior;
- whole-runtime cache-revision integrity;
- Settings-only install/update presentation.

## Testing rule

Preserve 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs exercise 13 families; Release Integration Burn-In is main/manual release-only.

Keep testing single-owner. Candidate B owns one import browser proof, Candidate C one restore/recovery browser proof, local Stability provenance + offline lifecycle + complete journey, deployed Stability the exhaustive public boundary, and Burn-In two complete stateful journeys.

Visual assertions must judge protected composition relationships and settled geometry. Do not lower a threshold or weaken a contract merely to obtain green CI. Diagnose product failure separately from browser/test-runtime/infrastructure failure.

A runtime revision may legitimately be `r2` or later, but every runtime reference, Service Worker cache identity, manifest/icon revision and lazy asset must match the exact active revision. Reject mixed revisions, not legitimate numbered hotfix generations.

## Exclusions

Do not add cloud, accounts, QR pairing, two-device transport, Local Profiles/Save Library, gameplay/scoring changes or a framework rewrite during v1.3 hardening unless the owner explicitly changes scope.

The next developer should not return to planning loops. Read the current authority, audit deeply, identify the first evidence-backed v1.3 defect or branch conflict, then implement and prove the correction.