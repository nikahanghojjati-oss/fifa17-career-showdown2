# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-13 ET

## Production milestone

v1.3.0 — Recovery & Device Resilience Hardening

Production identity: `v1.3.0` / `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`
Runtime release merge: `094401b649954656e27e4a92d027e9532e84ccbf`

The shipped Installable Offline App baseline remains protected throughout Local Profiles / Save Library work.

## Active development direction

Local Profiles / Save Library — feature release version intentionally unassigned.

The owner explicitly authorized this dependency-ordered direction after v1.3 production closure.

Foundation PR #46 merged at `b76baf3be8107a57c5898f691d5178ae1d8a8547`.

Canonical persistence integration PR #48 merged at `d62ea1f62ec92af4a90de04a6ef182ed1bf44692` after two independent 13/13 PR workflow generations and expected-head merge protection.

Post-merge all 14 permanent workflow families passed. Stability `31762998592`, deployed-site-smoke job `94653355400`, and Release Integration Burn-In `31762998620` all succeeded.

The persistence integration candidate is complete. Do not reimplement it.

## Immediate task — Save Library runtime authority cutover candidate

Start from a freshly verified current `main`. Do not blindly continue the old implementation or closure branches.

Before source changes:

1. read `00_HANDOFF_GOLDEN_RULE.md`, `00_DEVELOPER_START_HERE.md`, `00_CURRENT_HANDOFF.md`, `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`, `PROJECT_STATE.md` and this file;
2. inspect current `js/storage.js`, `js/storageTransaction.js`, `js/saveLibraryFoundation.js`, `js/saveLibraryPersistence.js`, the singleton create/load/save call graph, startup/optional-module loading ownership, `js/backup.js`, `js/importAnalysis.js`, `js/restore.js`, and all Candidate A/B/C plus Save Library persistence contracts;
3. independently verify production runtime still declares `1.3.0-r1` with previous whole shell `1.2.0-r2` unless newer source authority proves otherwise;
4. verify the exact current canonical production storage model before mutation;
5. create/update the public active handoff with exact verified base SHA, branch and owner-authorized bounded scope before implementation.

## Engineering objective

The next candidate must transfer active and in-progress Showdown runtime authority from the old singleton path to Save Library without allowing `careerModeShowdown.activeShowdown` to be recreated after a successful migration.

The already-proven migration machinery is a dependency, not a task to redesign.

The candidate must determine the narrowest safe runtime ownership and loading path under the very tight eager startup budget.

Do not simply load the full Save Library foundation eagerly. Current authoritative startup after PR #48 is:

- raw: `164967` bytes;
- gzip: `37425` bytes.

Locked ceilings remain:

- raw <= `165000`;
- gzip <= `37500`.

No budget may be raised to make the cutover fit.

## Current production persistence authority

Until the runtime cutover is explicitly implemented and proven, exactly three localStorage keys remain canonical in the public application:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Proposed future registry key:

`careerModeShowdown.saveLibrary`

Do not treat this as a fourth permanent canonical production key.

The runtime cutover must end in a coherent authority model where Save Library owns active/in-progress saves and the old singleton writer can no longer recreate independent active-save truth.

## Existing migration machinery that must be preserved

`js/storage.js` remains sole public canonical persistence/destructive mutation authority.

`js/storageTransaction.js` remains the raw transaction engine unless a narrowly justified internal extraction preserves that ownership boundary.

`js/saveLibraryPersistence.js` remains non-direct-storage orchestration over strict storage authority.

The migration already proves a temporary four-slot transition over:

- `saveLibrary`;
- `activeShowdown`;
- `legacyShowdowns`;
- `preferences`.

It preserves singleton-last retirement, exact four-slot snapshot authority, complete in-memory planning, exact preconditions, all-slot last-moment prewrite checks, transaction-owned mutation, reverse rollback, anti-clobber ownership, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, interruption/retry idempotence, conflicting dual-authority rejection and critical recovery on uncertainty.

Do not weaken or duplicate those semantics.

## Candidate A / B / C locks

Candidate A remains non-mutating export.

Candidate B remains strictly read-only analysis.

Candidate C remains the only import stage allowed to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()`.

This strict exact raw snapshot authority remains non-negotiable.

Never substitute `captureCareerModeRawBackupInputs()` as destructive snapshot authority.

Any backup/import envelope evolution remains outside this candidate unless the runtime cutover cannot be made coherent without a separately reviewed compatibility change. Do not redesign the envelope merely because Save Library exists.

## Scope exclusions

Do not build visible Save Library UI in this candidate by default.

Do not build profile creation, rename or historical mapping UI.

Do not auto-link historical Legacy manager identity by display-name equality or normalized spelling.

Do not implement cloud, accounts, QR pairing, synchronization, remote transport or public profiles.

Do not change gameplay or scoring.

Do not change Smart Back ownership.

Do not redesign protected visuals.

Do not alter the installed iOS loading composition.

Do not alter Settings-only install/update presentation.

Do not assign a feature release version yet.

## Permanent product locks

Exactly two managers.

Showdown lengths 1 / 3 / 5 / 10.

Same selected league.

Different permanent clubs.

Champions League +5.

League +3.

Domestic Cup +1.

100 League Points and/or 100 League Goals combined maximum +1.

Top Scorer and/or Top Assist combined maximum +1.

Maximum Season score 11.

Equal non-zero scores are Draw.

Only 0–0 invokes league position then league points.

## PWA locks

Current whole shell remains `1.3.0-r1`.

Previous whole shell remains `1.2.0-r2`.

`CMS_ACTIVATE_UPDATE` must verify the complete candidate shell, await successful `skipWaiting()`, then and only then acknowledge activation.

Never assemble mixed runtimes.

Service Worker and Cache Storage remain application-byte authorities only and may never become canonical user-data storage.

## Performance locks

Eager raw <= `165000`
Eager gzip <= `37500`
Reus startup portrait <= `95000`
Combined first-party startup <= `260000`
Normal loading minimum `2700 ms`
Reduced-motion loading `220 ms`

Do not raise budgets to make CI green.

## Validation authority

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13; Release Integration Burn-In remains `main`/manual release authority.

Do not weaken product assertions, recovery checks, visual geometry gates or performance ceilings to obtain green CI. Classify failures before editing implementation.

PR #48 established focused permanent regression evidence for strict four-slot persistence transition, interruption/retry, exact rollback, cross-slot stale barriers and anti-clobber recovery. Extend evidence only for new runtime-cutover failure classes; do not replace the existing proof.

## Quality-first boundary

The canonical persistence integration candidate is closed and publicly proven.

The runtime authority cutover is a distinct substantial task and should begin in a fresh development session from independently verified current `main`.

PR #37 / `agent/v13-hardening` remains untrusted historical work. Do not merge or revive its alternate shell.