# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-17 ET (Phase C first slice authorized)

This file is the sole primary owner of the current implementation authorization boundary. Roadmap ordering is not permission to implement a feature.

Work Environment Continuity (see `00_WORK_ENVIRONMENT_CONTINUITY.md`, `AGENTS.md`, and `WORK_ENVIRONMENT_STATUS.json`) routes every fresh development environment through validate → archive/replace → assess before substantial work. Continuity infrastructure does not authorize product changes.

## Current production milestone

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Current production Installable Offline App runtime: `1.3.0-r2`
Immediate previous known-good whole shell: `1.3.0-r1`
Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67 formatVersion 2 multi-Save portability)
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70 — Save Library / Local Profile Experience 2.0 first slice)
Phase B authority merge: `d5027f575ee416a1ad3f36b61fc09602e8239174` (PR #69)
Authority sync merge: `372e5570391616efd737fc4780ad0b51d8ec5ce4` (PR #68 Phase A)
Feature release version: intentionally unassigned

Visible Local Profiles / Save Library Core UI, explicit cross-Save/historical manager identity linkage, Identity-Safe Career Analytics / Trophy Room longitudinal consumption, presentation-only Local Profile display-label editing, formatVersion 2 full multi-Save backup/import portability, and the bounded Phase B Save Library / Local Profile Experience 2.0 first slice (richer cards, clearer Local Profile presentation, local non-destructive sorting) are complete, merged, deployed and production-proven.

## Current implementation authorization

The following candidates are closed as production-proven and must not be reopened:

- Local Profile display-label editing
- Identity-Safe Career Analytics
- formatVersion 2 full multi-Save backup/import portability (PR #67)
- Phase A documentation authority synchronization (PR #68)
- Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70, squash-merge `65b6c9db0a070b6e5e992a39dffeee23df0c6f08`)

**Authorized product candidate:** Phase C / Showdown Home & Season Experience deepening — first slice (owner instruction 2026-08-17).

### Phase C first slice scope (bounded)

1. Richer Showdown Home (dashboard) scoreboard — series lead/trail status chip + clearer visual hierarchy for the current series score between the two managers.
2. Contextual primary action label on the Home screen that reflects the real next step (examples: “ENTER SEASON X RESULTS”, “START TRANSFER CHALLENGE”, “VIEW COMPLETED SHOWDOWN”).
3. Last completed season result summary on the Home screen when at least one season has been played (compact, non-destructive presentation only).
4. Touch-target and spacing polish for the primary Home actions (min-height 44px where needed) so Chromebook / mobile interaction remains reliable.

Constraints for this first slice:

- Presentation-only. No new canonical storage keys, no mutation of Save Library / profile / season identity semantics, no change to scoring rules.
- Preserve multi-Save portability, Candidate A/B/C, identity-safe Analytics, and all performance ceilings.
- Do not expand into full Season Review redesign, Career Statistics 2.0, Legacy 2.0, or any further Phase C scope beyond the four items above.
- Do not touch public community / global leaderboard surfaces (ELIMINATED) or private remote joining (BLOCKED).

After this first slice is production-proven, stop and wait for a further explicit owner instruction before expanding Phase C or opening Phase D.

Out of scope until a later explicit owner instruction:

- Broader Save Library / Local Profile Experience 2.0 expansion beyond the already-shipped first slice
- Profile merge/delete or generic CRUD
- Broader Season Experience redesign beyond the first-slice items above
- Career Statistics 2.0 / Advanced Visual Analytics
- Legacy 2.0, Achievements, Trophy Room 2.0
- Cloud, private remote joining, public community surfaces

## Shipped multi-Save portability semantics that every future candidate must preserve

1. `CAREER_MODE_BACKUP_FORMAT_VERSION = 2` serializes the complete Save Library registry + Legacy + preferences (with optional projected activeShowdown for v1 compatibility).
2. v1 envelopes remain readable.
3. Clean-destination restore performs full-restore-clean of the complete library.
4. Existing-data destinations require explicit replace-all (Candidate C path); keep-current is the safe non-mutating path when the library key is omitted.
5. Invalid / truncated / corrupt backups are rejected before canonical mutation.
6. Same-name distinct profiles, explicit cross-Save profile reuse by ID, unresolved historical roles (null), and exact `activeSaveId` restoration are preserved.
7. Candidate A remains non-mutating export; Candidate B remains read-only analysis; Candidate C remains the sole destructive Apply stage with all existing ownership, freshness, transaction, rollback, anti-clobber and exact-verification guarantees.

## Shipped identity and Analytics semantics that every future candidate must preserve

1. stable `profile_*`, `save_*` and `season_*` identities remain authoritative;
2. display-name equality never maps identity automatically;
3. fresh New Showdown creation still intentionally creates fresh Local Profiles for its two manager roles;
4. explicit reuse of one Local Profile across Saves is the only supported longitudinal identity relationship unless an exact stable Save relationship or explicit historical mapping establishes it;
5. same-name distinct Local Profiles remain separate;
6. unresolved historical roles remain unresolved until explicitly mapped and are never guessed by name;
7. unresolved roles are excluded only from identity-dependent longitudinal manager totals, leaderboards and Trophy cabinets;
8. identity-independent completed Showdown/Season totals, points, trophies and Showdown/Season-scoped records remain complete;
9. Career Statistics and Trophy Room consume the same identity-safe Analytics authority;
10. Local Profile display names are presentation labels only and may be read through existing read-only exact Save Library snapshot authority without activating mutation authority;
11. identity and profile-presentation state participate in Analytics/Trophy revision invalidation;
12. Rivalry Statistics remains Showdown-scoped and semantically unchanged.

## Separate future areas are not assignments

Potential future work remains separately bounded, including:

- broader Save Library / Local Profile Experience 2.0 expansion beyond the first slice above
- further Showdown Home and Season experience deepening beyond the Phase C first slice above
- Career Statistics 2.0 and Advanced Visual Analytics
- Legacy 2.0, Achievements System, Trophy Room 2.0
- optional challenge / league / club content
- Backup and Recovery Experience 2.0 (UX only)
- Cloud Readiness architecture (no runtime)
- Optional Private Cloud Backup
- Private Account / Identity Layer
- Private Paired Device Capability
- Connected Rivalry
- Private Transfer Challenge device mode
- private sharing
- private remote joining / session system (important future requirement; still BLOCKED — no current auth).

Public community features and global leaderboard/rankings are **ELIMINATED** (owner decision 2026-08-16). Product direction is a private two-manager companion. Do not implement or re-introduce public community or global ranking surfaces unless the owner explicitly reverses that lock in a later roadmap amendment.

## Architecture locks

Preserve stable `profile_*`, `save_*` and `season_*` identities. Display names remain labels, never identity keys.

Public canonical storage remains `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`.

Never make `careerModeShowdown.activeShowdown` a permanent fourth canonical key.

`js/storage.js` remains public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. `js/saveLibraryRuntime.js` remains product Save Library and manager-identity mutation authority. `js/analytics.js` remains read-only derived Analytics authority. UI and Analytics code must not directly own canonical `localStorage`.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the only destructive import Apply stage.

Candidate C Apply must continue to use `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

Preserve the Installable Offline App whole-shell exactness and protected product/gameplay surfaces.

## Performance and validation boundary

Locked ceilings remain:

- eager raw `162782` <= `165000`
- eager gzip `37416` <= `37500`
- Reus startup portrait `88492` <= `95000`
- combined first-party startup `251274` <= `260000`
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

Repository authority remains 14 permanent workflow families and 27 protected multiline executable blocks. Normal implementation/authority PRs generally run 13 workflow families; Release Integration Burn-In remains main/manual release authority.

Never weaken tests, workflow topology, timeouts, recovery guarantees or performance ceilings merely to obtain green CI.

## Stop condition

Local Profile display-label editing, Identity-Safe Career Analytics, formatVersion 2 full multi-Save backup/import portability (PR #67), Phase A documentation authority sync (PR #68), and Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70) are closed and must not be reopened.

The currently authorized candidate is the bounded first slice of Phase C / Showdown Home & Season Experience deepening defined above. After that slice is production-proven, stop and wait for a further explicit owner instruction before expanding scope or opening Phase D.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

### Bootstrap / study (required first)

1. Independently confirm live `main` is `482013ca78859f45d1a2fd4906530ab83abb9266` (or a later SHA that preserves multi-Save + private two-manager locks + Phase B first slice + this Phase C authority).
2. Read `AGENTS.md`, `00_HANDOFF_GOLDEN_RULE.md`, `PRODUCT_PHILOSOPHY_LOCK.md`, `PROJECT_STATE.md`, this file, and the owner Full Comprehensive Project Roadmap (Private Two Manager direction).
3. Confirm no public community / global leaderboard work and no private remote joining work is in scope.

### Execution (after study)

**Current authorized work:** implement only the bounded Phase C first slice defined above (richer Home scoreboard, contextual primary action, last-season summary, touch-target polish).

Do not expand into further Season redesign, Statistics 2.0, Legacy, cloud, remote joining, or additional Phase C items until the owner issues an explicit new authorization.

Owner standing instruction 2026-08-16/17 (permanent operating rule) authorizes merge of green PRs without repeated permission loops; it does not authorize new product candidates beyond the stop condition above.
