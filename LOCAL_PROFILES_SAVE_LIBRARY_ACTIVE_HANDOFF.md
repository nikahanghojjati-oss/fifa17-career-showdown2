# Career Mode Showdown — Local Profiles / Save Library Active Handoff

Last updated: 2026-08-13 ET
Status: foundation merged and proven; next candidate is persistence integration
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Production application/runtime: `v1.3.0` / `1.3.0-r1`
Immediate previous whole runtime: `1.2.0-r2`
Feature release version: intentionally unassigned

## Owner instruction and scope

After the closed v1.3 production baseline was independently reconstructed, the owner explicitly said `Continue`.

This authorized the next approved dependency-ordered direction: Local Profiles / Save Library.

It did not authorize cloud, accounts, QR pairing, synchronization, gameplay/scoring changes, framework migration or broad visual redesign.

The historical roadmap number `v1.3.0` for this feature is superseded because `v1.3.0 — Recovery & Device Resilience Hardening` is already the shipped production release.

## Recovered feature contract

The owner-approved roadmap defines Local Profiles / Save Library as an extra-large milestone that must be split into testable candidates.

Required long-term outcomes include:

- stable opaque manager, Showdown and Season identity;
- editable manager display names independent of identity;
- a versioned local save registry with several in-progress Showdowns and one explicitly current Showdown;
- preserved completed Legacy archive;
- migration without duplication;
- recurring manager profiles;
- Save Library resume/rename/archive/template/delete actions with clear confirmation;
- backup/export/import compatibility;
- no silent manager merge by equal display names;
- no silent manager split caused by spelling changes;
- explicit review for ambiguous historical manager mapping;
- no cloud or online identity inside the local milestone.

`js/storage.js` remains public canonical persistence authority.

## Foundation candidate — complete

Branch:

`agent/local-profiles-save-library-foundation`

Session-start production main:

`908469d6034a9374b18d5d75f94fa371d8ad54a7`

Handoff bootstrap commit:

`cbc90700b37b9aa6dd703a94a8cbb977b76a6a25`

Implementation head:

`c6da6f4324c1590949aab2da6233f0ccc5fecfa0`

Final validated PR head:

`44606296ab734ab429ac34020d377cb3ca2c077f`

PR:

#46 — Add Save Library identity foundation

Merge:

`b76baf3be8107a57c5898f691d5178ae1d8a8547`

The foundation added:

- `js/saveLibraryFoundation.js`;
- `tests/contracts/save-library-foundation-contracts.cjs`;
- integration of that contract into `tests/support/run-contract-suite.cjs`.

The module is intentionally unloaded by the production app. It does not call localStorage and cannot mutate canonical data.

## Foundation identity model

Planning schema versions:

- Save Library schema: 1;
- Showdown identity schema: 1;
- profile schema: 1.

Proposed future registry key:

`careerModeShowdown.saveLibrary`

This key is not canonical yet.

Stable migration IDs are deterministic SHA-256-derived opaque IDs based on existing persisted record identity:

- `save_*` from existing Showdown identity;
- `season_*` from stable save ID plus canonical Season/round number;
- `profile_*` for the current active Showdown from stable save identity plus explicit player role.

Display-name equality is never identity authority. Two managers with the same name remain separate identities.

Historical Legacy records that do not share the exact current Showdown identity are not auto-linked to profiles and remain explicit mapping work for a later candidate.

The planner fails closed on corrupt raw JSON, malformed registry state, same-ID/different-content Legacy conflicts, missing Showdown IDs and invalid/duplicate Season numbering.

A valid existing Save Library yields `already-migrated` with no mutation candidate.

## Validation evidence

Focused local checks passed:

- syntax check for `js/saveLibraryFoundation.js`;
- `tests/contracts/save-library-foundation-contracts.cjs`.

The implementation head `c6da6f4324c1590949aab2da6233f0ccc5fecfa0` passed all 13 normal PR workflow families.

The final PR head `44606296ab734ab429ac34020d377cb3ca2c077f` passed a second fresh 13/13 generation before merge.

The repository contract suite explicitly printed the Save Library foundation PASS line.

Eager startup remained:

- 164,563 raw bytes;
- 37,355 gzip bytes.

No budget was raised.

After merge `b76baf3be8107a57c5898f691d5178ae1d8a8547`, all 14 permanent push-triggered workflow families succeeded.

Post-merge Stability `31758874808` succeeded, including deployed-site-smoke job `94641012805`.

Public smoke passed exact runtime bytes, runtime provenance, Home, football imagery, Candidate A, Candidate B, Candidate C, install/offline and the complete stateful journey.

Release Integration Burn-In `31758874804` passed 2/2 complete stateful journeys.

Technical/developer proof remains separate from owner visual/product acceptance.

## Current persistence authority

The currently canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

The proposed `careerModeShowdown.saveLibrary` key is planning-only.

Do not create a fourth permanent canonical registry beside the singleton key.

## Next candidate — canonical persistence integration

This is the exact next substantial task.

The transition must safely reason about four raw slot names during migration:

- `saveLibrary`;
- `activeShowdown`;
- `legacyShowdowns`;
- `preferences`.

The engineering objective is not “add a fourth key.” It is to prove a rollback-safe transition where the eventual Save Library becomes the sole active/in-progress save authority and the old singleton active slot is retired atomically.

No intermediate accepted state may leave both `activeShowdown` and `saveLibrary` as independent canonical active-save sources.

Before implementation, inspect:

- `js/storage.js`;
- `js/storageTransaction.js`;
- `js/saveLibraryFoundation.js`;
- `js/backup.js`;
- `js/importAnalysis.js`;
- `js/restore.js`;
- all Candidate A/B/C contract and browser audit files.

The migration must preserve strict exact raw snapshot authority, stale/prewrite barriers, complete planning before mutation, transaction-owned mutation/rollback, anti-clobber ownership, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, critical recovery and idempotence across interruption/retry.

Candidate A remains non-mutating. Candidate B remains read-only. Candidate C must not be weakened.

Do not expose Save Library UI, profile creation/rename/mapping UI, backup-envelope redesign, cloud or synchronization in this candidate.

## Tool and failure history

A read-only local clone attempt failed because the execution environment could not resolve `github.com`. No mutation occurred.

The first connector handoff-file creation attempt was blocked before mutation; the handoff was then published via Git object operations.

The first full-body PR #46 creation attempt was blocked before mutation; a minimal PR creation succeeded and its body was updated afterward.

The first mark-ready call was blocked before mutation. A direct merge while the PR was still draft returned HTTP 405 and did not merge. `gh` was unavailable in that environment. A later mark-ready call succeeded, then PR #46 merged only with expected head `44606296ab734ab429ac34020d377cb3ca2c077f`.

During the post-merge documentation seal, the first connector attempt to replace this active handoff was blocked before mutation. No branch content changed from that blocked call; the handoff was then routed through Git blob/tree/commit operations.

PR #47 documentation validation then produced one meaningful failure on its initial head `777e82e538c6bd3bd868c3a95b2e2c24bafe245d`: Validate Static App run `31759464388`, job `94642505926`, failed inside the complete repository contract suite because `tests/contracts/stability-contracts.cjs` requires `NEXT_TASK.md` to retain the phrase `Installable Offline App`. This was classified as a current-documentation contract mismatch, not a runtime defect and not a test defect. The correction restored that protected baseline wording in `NEXT_TASK.md`; no assertion was weakened and no runtime/test source changed.

No blocked or failed operation is production state.

## Quality-first handoff decision

The identity foundation is merged, fully validated and publicly smoke-proven. The next persistence candidate changes canonical data ownership and destructive transaction semantics, making it a materially different and higher-risk task.

Under the permanent quality-first handoff rule, do not start that candidate in the context-heavy foundation session. Start it in a fresh development session that independently verifies the documentation-seal `main` SHA and reads this file, `00_CURRENT_HANDOFF.md`, `PROJECT_STATE.md` and `NEXT_TASK.md` first.
