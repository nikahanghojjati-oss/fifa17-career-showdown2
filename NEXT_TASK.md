# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-13 ET

## Production milestone

v1.3.0 — Recovery & Device Resilience Hardening

Production identity: `v1.3.0` / `1.3.0-r1`
Immediate previous known-good whole shell: `1.2.0-r2`
Production proof: `V1.3.0_PRODUCTION_PROOF.md`
Runtime release merge: `094401b649954656e27e4a92d027e9532e84ccbf`

The shipped Installable Offline App baseline remains protected throughout the new local persistence work; the Save Library foundation did not change its runtime behavior or ownership boundaries.

## Active development direction

Local Profiles / Save Library — version pending.

The owner explicitly authorized continuation into this dependency-ordered direction after v1.3 production closure.

Foundation PR #46 merged at `b76baf3be8107a57c5898f691d5178ae1d8a8547`. The merged `js/saveLibraryFoundation.js` is planning/identity logic only, is not loaded by the production application, and performs no runtime storage mutation. Production remains `v1.3.0` / `1.3.0-r1`.

## Immediate task — canonical persistence integration candidate

Start from a freshly verified current `main` and treat this as a distinct high-risk candidate, not a continuation of an uncommitted branch.

Before implementation:

1. read `00_HANDOFF_GOLDEN_RULE.md`, `00_DEVELOPER_START_HERE.md`, `00_CURRENT_HANDOFF.md`, `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`, `PROJECT_STATE.md` and this file;
2. inspect current `js/storage.js`, `js/storageTransaction.js`, `js/saveLibraryFoundation.js`, `js/backup.js`, `js/importAnalysis.js`, `js/restore.js`, and the Candidate A/B/C contracts/browser audits;
3. verify production runtime still declares `1.3.0-r1` with previous whole shell `1.2.0-r2` unless newer source authority proves otherwise;
4. verify the current canonical persistence model before changing it.

The engineering goal is to prove a rollback-safe atomic transition from the current singleton active-save model toward the Save Library model without creating two simultaneous canonical active-save authorities.

Current canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Proposed future registry key:

`careerModeShowdown.saveLibrary`

That proposed key is not yet canonical. The target post-migration model may retire `careerModeShowdown.activeShowdown` only when a transactionally proven migration makes the Save Library the sole active/in-progress save authority. Do not leave both as independent canonical sources of truth.

The transition candidate must handle the fact that migration temporarily reasons about four raw names: `saveLibrary`, `activeShowdown`, `legacyShowdowns`, and `preferences`. Do not simply append a fourth permanent key to the old transaction engine and declare migration complete.

## Persistence safety requirements

`js/storage.js` must remain sole public canonical persistence/destructive mutation authority. `js/storageTransaction.js` remains the raw transaction engine unless an explicitly justified internal extraction preserves that ownership boundary.

Any migration commit must preserve:

- strict exact raw snapshot authority;
- immutable confirmed intent where user decisions exist;
- complete in-memory planning before mutation;
- stale-state/precondition barriers;
- last-moment exact-byte prewrite verification;
- transaction-owned mutation and rollback;
- anti-clobber ownership checks;
- exact post-write verification;
- byte-for-byte rollback verification;
- corrupt-byte preservation;
- critical recovery when ownership becomes uncertain;
- idempotence across reload/retry/interruption;
- no partial migration that leaves both old and new active-save authorities live.

Candidate A remains non-mutating export. Candidate B remains strictly read-only analysis. Candidate C remains the only import stage allowed to mutate canonical restore state and must not be weakened by the new registry work.

Do not use `captureCareerModeRawBackupInputs()` as destructive migration authority when strict exact snapshot authority is required.

## Scope exclusions for this candidate

Do not implement the visible Save Library screen yet.

Do not implement profile rename/create/mapping UI yet.

Do not auto-link historical Legacy manager identity by display-name equality or normalized spelling.

Do not redesign backup/import envelopes until the persistence transition itself is proven and the correct compatibility boundary is understood.

Do not add cloud, accounts, QR pairing, synchronization, remote transport, public profiles or framework migration.

Do not alter gameplay, scoring, Smart Back, protected visuals, loading composition or Settings-only install/update presentation.

Do not assign a feature release version merely to make the candidate look complete.

## Foundation evidence

PR #46 passed all 13 normal PR workflow families on its implementation head and again on its final handoff head.

After merge to `main` at `b76baf3be8107a57c5898f691d5178ae1d8a8547`, all 14 permanent push-triggered workflow families succeeded. Post-merge Stability `31758874808` passed contracts, canonical Chromium integration and deployed-site smoke. Deployed-site-smoke job `94641012805` passed exact Pages runtime-byte verification, runtime provenance, Home, football visuals, Candidate A, Candidate B, Candidate C, install/offline and the complete public journey. Release Integration Burn-In `31758874804` passed 2/2 complete stateful journeys.

The foundation contract preserves deterministic stable save/profile/Season identity planning, blocks same-ID/different-content Legacy conflicts, refuses corrupt raw source, leaves ambiguous historical manager identity for explicit mapping, and is idempotent when a valid Save Library already exists.

## Validation authority

There are 14 permanent workflow families and 27 protected multiline executable blocks. Normal PRs run 13 families; Release Integration Burn-In remains `main`/manual release authority.

Do not weaken product assertions, recovery checks, visual geometry gates or performance ceilings to obtain green CI. Classify failures before editing implementation.

## Quality-first boundary

This persistence transition is the next substantial task and should begin in a fresh development session after independently verifying the final documentation-seal `main` SHA. The foundation checkpoint is intentionally a clean handoff boundary under `00_HANDOFF_GOLDEN_RULE.md`.

PR #37 remains untrusted historical work. Do not merge or revive its alternate shell.
