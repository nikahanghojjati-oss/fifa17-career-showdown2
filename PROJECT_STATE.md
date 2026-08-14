# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-13 ET

## Production authority

Application: v1.3.0 — Recovery & Device Resilience Hardening
Production runtime: `1.3.0-r1`
Production previous known-good runtime: `1.2.0-r2`
Production status: merged, deployed, exact-byte verified and technically production-proven
Release PR: #42
Runtime merge: `094401b649954656e27e4a92d027e9532e84ccbf`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`

Owner visual/product acceptance remains separate from automated technical proof and is not inferred here.

PR #51 has not yet merged at this documentation boundary. The production `main` runtime must therefore not be described as Save Library-cut-over until the PR is actually merged and post-merge proof is complete.

## Active development authority

The owner-authorized Local Profiles / Save Library direction remains active. Feature release version remains intentionally unassigned.

Completed dependency-ordered foundations:

- Identity foundation PR #46 merged at `b76baf3be8107a57c5898f691d5178ae1d8a8547`.
- Canonical persistence PR #48 merged at `d62ea1f62ec92af4a90de04a6ef182ed1bf44692`.
- Save Library runtime authority cutover implementation in PR #51 is technically complete and green.

Active PR:

#51 — Cut over runtime authority to Save Library

Active branch:

`agent/save-library-runtime-authority-cutover`

Exact runtime/test implementation head:

`46d3e9d10d849b82e9d7d301fb6646404dec82bf`

That implementation head passed all 13 normal PR workflow families.

The first documentation-closure head:

`89fa6c185d9829269f6516feb80eccaa49060383`

changed only `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md` relative to the green implementation head and also passed all 13 normal PR workflow families.

The current task is documentation closure and fresh exact-head validation for PR #51. Do not reopen the runtime architecture unless a new exact-head validation exposes a genuine defect.

Detailed implementation and failure/correction authority lives in `SAVE_LIBRARY_RUNTIME_AUTHORITY_CUTOVER_ACTIVE_HANDOFF.md`.

## Runtime authority cutover state

`js/saveLibraryCutover.js` is lazy and remains outside eager HTML.

Only confirmed Start or Continue actions may initiate singleton-to-Save-Library migration. Predictive hover/focus gameplay warm-up remains non-mutating.

Opening Settings or Legacy on an unmigrated singleton device remains non-mutating. On an already-migrated device, Settings or Legacy may load/reactivate Save Library compatibility authority so backup, restore, reset and Legacy surfaces can interpret canonical data.

Start and Continue are synchronously locked before the lazy loader begins, preventing rapid double activation from racing the loader gap.

`js/storage.js` remains the sole public raw localStorage authority. `js/saveLibraryRuntime.js` and `js/saveLibraryCutover.js` perform no direct localStorage access.

Normal `saveCurrentShowdown()` no longer writes singleton active-save bytes. Gameplay retains its synchronous persistence facade but routes through Save Library runtime authority after activation.

New Showdowns receive stable save/profile identity before first authoritative persistence. Completed Seasons receive stable season identity before synchronous persistence.

Stable identity prefixes remain:

- `save_*` for Showdowns;
- `season_*` for Seasons;
- `profile_*` for manager identities.

Display-name equality is never identity authority. Two managers with identical display names still receive distinct manager identities. Ambiguous historical manager identity remains explicit future mapping work.

## Canonical key model

Before explicit Save Library activation, the compatibility-facing public canonical storage-key model remains exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

After successful Save Library runtime cutover, the public canonical model becomes exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is not a fourth permanent canonical key after cutover. It is only a transitional migration/recovery slot and normal gameplay must never recreate singleton active-save authority after successful migration.

Service Worker and Cache Storage remain application-byte authorities only and never canonical user-data authority.

## Fail-closed runtime ownership

`js/saveLibraryRuntime.js` validates exact owned Save Library bytes before writes and fails closed on:

- cross-tab Save Library drift;
- singleton reappearance;
- corrupt Save Library bytes;
- ownership mismatch;
- critical recovery lock;
- unverifiable state.

`js/storageTransaction.js` remains the raw transaction engine with exact preconditions, requested-slot prewrite guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact verification and critical recovery when rollback ownership cannot be proven.

The temporary migration reasoning set may include `saveLibrary`, `activeShowdown`, `legacyShowdowns` and `preferences`, but this never creates a permanent four-key authority model.

## Candidate A / B / C locks

Candidate A remains non-mutating export and backup format remains v1. It may project the authoritative active Save Library Showdown into the existing backup active-Showdown field without mutating canonical data.

Candidate B remains strictly read-only analysis.

Candidate C remains the only import stage allowed to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority.

Never substitute `captureCareerModeRawBackupInputs()` as destructive snapshot authority.

The established three-slot Candidate C path remains mandatory for unmigrated singleton state. Migrated Save Library devices additionally guard exact Save Library bytes and use the Save Library restore path. Dual authority fails closed.

## Final implementation performance proof

On exact implementation head `46d3e9d10d849b82e9d7d301fb6646404dec82bf`, Final Polish reported:

- eager raw: `162935` bytes;
- eager gzip: `37475` bytes;
- lazy feedback: `4845` bytes.

Locked ceilings remain:

- eager raw <= `165000`;
- eager gzip <= `37500`;
- Startup Marco Reus portrait <= `95000`;
- combined first-party startup <= `260000`;
- normal loading minimum `2700 ms`;
- reduced-motion loading `220 ms`.

No performance limit may be raised to make CI green.

## PR #51 validation state

Implementation head `46d3e9d10d849b82e9d7d301fb6646404dec82bf` passed all 13 normal PR workflow families:

- Validate Static App;
- Validate Final Polish;
- Validate Home Bootstrap;
- Validate Settings Workstream;
- Validate League Confirmation;
- Validate Transfer Workstream;
- Validate Season Review;
- Validate Statistics Workstream;
- Validate V1 Visual Immersion;
- Validate Licensed Football Visuals;
- Validate Candidate B Import Analysis;
- Validate Candidate C Atomic Restore;
- Validate Stability Lane.

Documentation-only head `89fa6c185d9829269f6516feb80eccaa49060383` also completed all 13 successfully.

Before merge, the exact final documentation head must receive a fresh applicable PR validation generation. No test may be weakened and no budget may be raised.

## Installable Offline App authority

Current whole shell: `1.3.0-r1`
Immediate previous known-good shell: `1.2.0-r2`

The shipped Installable Offline App baseline remains protected.

Preserve verified atomic cache population, explicit safe update activation, Candidate C busy/recovery gating, whole-runtime selection, previous-known-good recovery, fail-closed behavior when no coherent shell exists, app-namespace-only cleanup, unrelated-cache preservation, worker-owned connectivity probing, nonfatal external-media degradation and lazy PWA loading.

`CMS_ACTIVATE_UPDATE` must verify the complete candidate shell, await successful `skipWaiting()`, then and only then acknowledge activation. Never assemble mixed runtimes.

Install/update controls remain Settings-only.

## Protected presentation and product rules

Preserve the installed iOS loading composition, proven FIFA 17-inspired menu shell and subject-safe football photography.

Exactly two managers. Showdown lengths are 1, 3, 5 or 10. Same selected league, different permanent clubs. Champions League +5. League +3. Domestic Cup +1. 100 League Points and/or 100 League Goals combined maximum +1. Top Scorer and/or Top Assist combined maximum +1. Maximum Season score 11. Equal non-zero scores are Draw. Only 0–0 invokes league position then league points.

League confirmation, Club confirmation, Transfer Challenge, Season Entry, Season Review, Statistics, Legacy, Trophy Room, Rule Book, Settings, Home/Continue Career, Create Showdown and Smart Back remain protected.

## Next dependency-ordered candidate after PR #51

Do not begin it inside PR #51.

After PR #51 merges, current `main` must be independently re-fetched and post-merge proof completed before new feature work begins.

The next substantial candidate is a separately bounded visible Local Profiles / Save Library product-UI candidate. It must start in a fresh development session and reconstruct exact owner/repository UI scope before implementation.

Do not automatically include:

- historical manager auto-linking by display-name equality;
- cloud;
- accounts;
- QR pairing;
- synchronization;
- remote transport;
- backup/import envelope redesign;
- gameplay or scoring changes;
- protected visual redesign;
- feature release-version assignment.

Historical ambiguous manager identities remain explicit future mapping work.

## Validation topology

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13; Release Integration Burn-In remains `main`/manual release authority.

## Branch authority and historical warnings

PR #46 is the merged identity foundation authority.

PR #48 is the merged canonical persistence integration authority.

PR #51 is the active runtime authority cutover candidate and is not production authority until merged and post-merge proven.

PR #37 / `agent/v13-hardening` remains untrusted historical work and must not be merged or used as a baseline. PR #40 remains the detailed v1.3 salvage/audit record. PR #42 is the v1.3 runtime release PR.

No visible Save Library UI, cloud, accounts, synchronization, QR pairing, gameplay/scoring changes or framework migration is claimed as implemented by PR #51.