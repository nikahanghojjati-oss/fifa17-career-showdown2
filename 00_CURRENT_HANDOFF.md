# Career Mode Showdown — Current Complete Handoff

Last updated: 2026-08-13 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Production authority

Application: v1.3.0 — Recovery & Device Resilience Hardening
Production runtime: `1.3.0-r1`
Previous known-good runtime: `1.2.0-r2`
Runtime release PR: #42
Runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`

The v1.3 runtime remains technically production-proven. Owner visual/product acceptance is a separate evidence channel and must not be inferred from CI or developer verification.

## Current development authority

The owner explicitly authorized the next dependency-ordered product direction by saying `Continue` after the repository was independently reconstructed and the closed v1.3 baseline was verified.

The active direction is:

Local Profiles / Save Library — version pending.

The historical roadmap label that once called this `v1.3.0` is superseded. `v1.3.0 — Recovery & Device Resilience Hardening` is already the shipped production release, so do not silently reuse that version number.

Detailed active-feature history and reasoning live in `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`.

## Foundation candidate — merged

Branch:

`agent/local-profiles-save-library-foundation`

Foundation bootstrap handoff commit:

`cbc90700b37b9aa6dd703a94a8cbb977b76a6a25`

Implementation head:

`c6da6f4324c1590949aab2da6233f0ccc5fecfa0`

Final PR head after validation handoff:

`44606296ab734ab429ac34020d377cb3ca2c077f`

PR:

#46 — Add Save Library identity foundation

PR base:

`908469d6034a9374b18d5d75f94fa371d8ad54a7`

Merge:

`b76baf3be8107a57c5898f691d5178ae1d8a8547`

PR #46 introduced only the bounded identity/migration planning foundation required before canonical persistence work.

Changed source/test authority:

- `js/saveLibraryFoundation.js`;
- `tests/contracts/save-library-foundation-contracts.cjs`;
- `tests/support/run-contract-suite.cjs`;
- `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`.

The foundation module is intentionally not loaded by `index.html`, `service-worker.js` or the optional-module runtime path. It performs no localStorage writes. It did not change application version, runtime revision, service-worker semantics, gameplay, scoring, navigation, visual behavior or deployed canonical storage.

## Foundation identity decisions

The merged pure planning foundation defines versioned identity/migration contracts without promoting them to runtime storage authority.

Proposed future registry key:

`careerModeShowdown.saveLibrary`

This key is not currently canonical.

Stable migration identity planning uses opaque deterministic SHA-256-derived IDs based on existing persisted record identity rather than display-name equality:

- `save_*` derives from an existing Showdown ID when no stable save ID already exists;
- `season_*` derives from stable save ID plus canonical round/Season number;
- initial `profile_*` identities derive from stable save identity plus explicit player role.

Two managers with identical display names remain distinct identities.

Historical Legacy records are not silently linked to profiles by matching names or normalized spelling. Records that do not share the exact current Showdown identity remain unresolved and are surfaced for later explicit mapping.

The planner fails closed on corrupt raw input, malformed Save Library input, conflicting same-ID/different-content Legacy records, missing Showdown IDs and ambiguous/duplicate Season numbering.

A valid existing Save Library returns an idempotent `already-migrated` planning result with no mutation candidate.

## Foundation validation

Focused local evidence passed:

- syntax check for `js/saveLibraryFoundation.js`;
- `tests/contracts/save-library-foundation-contracts.cjs`.

The exact implementation head `c6da6f4324c1590949aab2da6233f0ccc5fecfa0` passed all 13 normal PR workflow families together.

The exact final PR head `44606296ab734ab429ac34020d377cb3ca2c077f` then passed an independent fresh 13/13 generation before merge.

The Static App evidence explicitly executed the new foundation contract and preserved eager startup at:

- raw: 164,563 bytes;
- gzip: 37,355 bytes.

Both remain under the locked 165,000 / 37,500 ceilings. Workflow topology remained 14 permanent families and 27 protected multiline executable blocks.

After PR #46 merged at `b76baf3be8107a57c5898f691d5178ae1d8a8547`, all 14 push-triggered permanent workflow families succeeded.

Post-merge Stability:

`31758874808` — success.

Its deployed-site-smoke job:

`94641012805` — success.

That public-boundary job passed:

- exact Pages runtime-byte verification;
- runtime-error provenance;
- Home visual audit;
- crop-safe football-photo audit;
- Candidate A backup/export;
- Candidate B import analysis;
- Candidate C atomic restore/recovery;
- install/offline boundary;
- complete public stateful journey.

Release Integration Burn-In:

`31758874804` — success, 2/2 independent complete stateful journeys.

This evidence proves that merging the unloaded foundation did not regress the production runtime. It does not fabricate owner visual acceptance.

## Current canonical persistence authority

Exactly three localStorage keys remain canonical today:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Do not treat the proposed `careerModeShowdown.saveLibrary` key as canonical merely because the planning module names it.

`js/storage.js` remains sole canonical persistence/destructive mutation authority.

`js/storageTransaction.js` remains the raw transaction engine.

`js/screens.js` remains navigation/history/Smart Back authority.

`js/scoring.js` and `js/analytics.js` retain their existing authorities.

Service Worker/Cache Storage store application bytes only and may never become canonical user-data authority.

## Protected recovery model

Candidate A remains non-mutating export.

Candidate B remains strictly read-only analysis.

Candidate C remains the only import stage allowed to commit canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` strict exact raw snapshot authority. `captureCareerModeRawBackupInputs()` must never substitute as destructive mutation authority.

Preserve immutable confirmed intent, exact raw preconditions, stale-state barriers, complete in-memory planning, last-moment prewrite checks, transaction-owned mutation and rollback, anti-clobber ownership, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation and critical recovery when ownership is uncertain.

## PWA / visual / product locks

Current whole shell remains `1.3.0-r1`; immediate previous known-good whole shell remains `1.2.0-r2`.

Preserve atomic whole-shell caching, safe activation, Candidate C gating, whole-runtime selection, previous-runtime recovery, worker-owned connectivity probing, unrelated-cache preservation and Settings-only install/update presentation.

`CMS_ACTIVATE_UPDATE` must verify the whole shell, await successful `skipWaiting()`, then acknowledge acceptance.

Preserve the r2 installed iOS loading composition: bounded top band, independent subject-safe Marco Reus image box, width-owned composition and opacity/filter-only animation.

Exactly two managers. Showdown lengths 1/3/5/10. Same selected league, different permanent clubs. Existing scoring and the 11-point maximum remain locked. Equal non-zero scores are Draw. Only 0–0 uses league position then league points.

## Next legal engineering task

The next candidate is canonical persistence integration for the Save Library foundation.

This is intentionally a separate high-risk candidate.

The migration must safely reason about a temporary four-name transition boundary:

- `saveLibrary`;
- `activeShowdown`;
- `legacyShowdowns`;
- `preferences`.

The current three-key model remains canonical until a transactionally proven migration changes that authority.

The next developer must not merely add `saveLibrary` as a fourth permanent canonical key. The intended direction is to make the Save Library the eventual sole authority for active/in-progress saves and retire `activeShowdown` only within a verified atomic transition.

Do not create a state where old `activeShowdown` and new `saveLibrary` independently claim canonical active-save truth.

Before source changes, inspect `js/storage.js`, `js/storageTransaction.js`, `js/saveLibraryFoundation.js`, `js/backup.js`, `js/importAnalysis.js`, `js/restore.js`, and all Candidate A/B/C contracts/browser audits.

The persistence candidate must prove strict snapshot coverage, preconditions, rollback ownership, exact verification, interruption/retry idempotence and corrupt-byte preservation across the transition.

Do not start visible Save Library UI, profile-management UI, historical manager-profile mapping UI, cloud, accounts, QR pairing, synchronization, backup-envelope redesign, gameplay/scoring changes or framework migration as part of this candidate.

Do not assign a release version yet.

## Historical branch and tool warnings

PR #37 / `agent/v13-hardening` remains untrusted historical work. Do not merge it, revive its alternate shell or copy its stale lockfile.

PR #40 remains the detailed v1.3 salvage/audit record. PR #42 is the v1.3 runtime release path. PR #44 is the permanent quality-first handoff policy. PR #45 is its publication seal. PR #46 is the merged Save Library foundation authority.

Issue #41 `TEMP IGNORE` remains a closed accidental tool-routing artifact and must not be reopened.

Earlier historical tool incidents remain part of repository history: PR #40's body was once accidentally replaced with `checkpoint` then repaired; issue #41 was accidentally created then closed; a compare `.diff` request once returned 404; several connector safety blocks occurred before mutation; `gh` was unavailable in prior execution environments. None of those incidents changed production application source unless explicitly recorded otherwise.

This foundation session also had several blocked operations before mutation: the first active-handoff file creation call, the first full-body PR #46 creation call, and the first mark-ready call. A direct merge attempt while PR #46 remained draft returned HTTP 405 and did not merge. The PR was subsequently marked ready successfully and merged only with expected head `44606296ab734ab429ac34020d377cb3ca2c077f`.

A read-only local clone attempt failed because that execution environment could not resolve `github.com`; no repository mutation occurred. The GitHub connector remained source authority.

## Quality-first continuation boundary

The foundation merge plus post-merge public proof is a coherent repository boundary. Canonical persistence integration changes storage ownership and destructive transaction semantics, so it is a distinct substantial task.

Under `00_HANDOFF_GOLDEN_RULE.md`, begin that task in a fresh session after independently verifying current `main` and reading this handoff plus `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md` and `NEXT_TASK.md`.
