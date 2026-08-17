# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-16 ET (Phase B authorization)

This file is the sole primary owner of the current implementation authorization boundary. Roadmap ordering is not permission to implement a feature.

Work Environment Continuity (see `00_WORK_ENVIRONMENT_CONTINUITY.md`, `AGENTS.md`, and `WORK_ENVIRONMENT_STATUS.json`) routes every fresh development environment through validate → archive/replace → assess before substantial work. Continuity infrastructure does not authorize product changes.

## Current production milestone

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Current production Installable Offline App runtime: `1.3.0-r2`
Immediate previous known-good whole shell: `1.3.0-r1`
Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67 multi-Save)
Authority sync merge: `372e5570391616efd737fc4780ad0b51d8ec5ce4` (PR #68 Phase A)
Feature release version: intentionally unassigned

Visible Local Profiles / Save Library Core UI, explicit cross-Save/historical manager identity linkage, Identity-Safe Career Analytics / Trophy Room longitudinal consumption, presentation-only Local Profile display-label editing, and formatVersion 2 full multi-Save backup/import portability are complete, merged, deployed and production-proven.

## Current implementation authorization

The following candidates are closed as production-proven and must not be reopened:

- Local Profile display-label editing
- Identity-Safe Career Analytics
- formatVersion 2 full multi-Save backup/import portability (PR #67)
- Phase A documentation authority synchronization (PR #68)

**Authorized product candidate (owner instruction 2026-08-16):**  
**Save Library / Local Profile Experience 2.0** (Phase B of the owner Full Comprehensive Project Roadmap).

Scope of this authorization (bounded first slice, not the entire Experience 2.0):

1. Evidence-driven richer Save Library cards (progress indicators, season counts, last-played / status cues) without changing canonical storage keys or identity semantics.
2. Clearer Local Profile presentation on the Save Library surface (still presentation labels only; no identity mutation beyond existing display-label editing).
3. Sorting / ordering controls that remain local and non-destructive.
4. Preserve all shipped multi-Save portability, Candidate A/B/C, identity-safe Analytics, and performance ceilings.

Out of scope for this authorization (require a later explicit instruction):

- Profile merge/delete or generic CRUD
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
- Showdown Home and Season experience deepening
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

Local Profile display-label editing, Identity-Safe Career Analytics, formatVersion 2 full multi-Save backup/import portability (PR #67), and Phase A documentation authority sync (PR #68) are closed and must not be reopened.

The currently authorized candidate is the bounded first slice of Save Library / Local Profile Experience 2.0 defined above. After that slice is production-proven, stop and wait for a further explicit owner instruction before expanding scope or opening Phase C.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

### Bootstrap / study (required first)

1. Independently confirm live `main` is `372e5570391616efd737fc4780ad0b51d8ec5ce4` (or a later SHA that preserves multi-Save + private two-manager locks + Phase A authority).
2. Read `AGENTS.md`, `00_HANDOFF_GOLDEN_RULE.md`, `PRODUCT_PHILOSOPHY_LOCK.md`, `PROJECT_STATE.md`, this file, and the owner Full Comprehensive Project Roadmap (Private Two Manager direction).
3. Confirm no public community / global leaderboard work and no private remote joining work is in scope.

### Execution (after study)

**Current authorized work:** Phase B first slice — Save Library / Local Profile Experience 2.0 (richer cards, progress cues, Local Profile presentation, local sorting).

1. On branch `phase-b/save-library-experience-2.0-authority` (or successor), land the authority update that records this candidate.
2. Inspect current Save Library UI + runtime surfaces (`js/saveLibraryRuntime.js`, relevant screens/CSS) and produce a short evidence-backed design note for the first visible improvement.
3. Implement only the bounded first slice with contracts and high-risk depth.
4. Do not expand into Statistics 2.0, Legacy, cloud, or remote joining.

Owner standing instruction 2026-08-16 authorizes continuation through this Phase B first slice. Further phases still require explicit instruction after production proof of the current slice.
