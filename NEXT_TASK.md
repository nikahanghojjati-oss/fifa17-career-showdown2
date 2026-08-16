# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-16 ET

This file is the sole primary owner of the current implementation authorization boundary. Roadmap ordering is not permission to implement a feature.

## Current production milestone

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Current production Installable Offline App runtime: `1.3.0-r2`
Immediate previous known-good whole shell: `1.3.0-r1`
Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27`
Validated PR #67 head (pre-merge): `a58a471b8e7199cd4a29f5096de87709b7655ae8`
Feature release version: intentionally unassigned

Visible Local Profiles / Save Library Core UI, explicit cross-Save/historical manager identity linkage, Identity-Safe Career Analytics / Trophy Room longitudinal consumption, presentation-only Local Profile display-label editing, and formatVersion 2 full multi-Save backup/import portability are complete, merged, deployed and production-proven.

PR #67 (formatVersion 2 multi-Save portability) was independently reviewed at high-risk depth, squash-merged to `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27`, passed Stability Lane 31928164354 attempt 2 (including visible Save Library audit), Pages deployment, and all Validate-* workflows. Owner visual/product acceptance recorded 2026-08-16.

## Current implementation authorization

The following candidates are closed as production-proven and must not be reopened:

- Local Profile display-label editing
- Identity-Safe Career Analytics
- formatVersion 2 full multi-Save backup/import portability (PR #67)

**No product candidate is currently authorized for implementation.**

The next authorized work is documentation authority synchronization only (this file and `PROJECT_STATE.md` now correctly record the multi-Save milestone as complete). After that synchronization is published, any subsequent product candidate requires a fresh explicit owner instruction selecting from the owner roadmap Phase B onward (Save Library / Local Profile Experience 2.0, Showdown & Season experience deepening, Career Statistics 2.0, etc.).

Do not begin Save Library Experience 2.0, Local Profile Experience 2.0, broader Analytics, Legacy expansion, Achievements, cloud, private remote joining, or any other future-area work without a new explicit owner authorization that names the exact candidate.

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

- evidence-driven Save Library / Local Profile Experience 2.0 (richer cards, progress, sorting, profile career views);
- Showdown Home and Season experience deepening;
- Career Statistics 2.0 and Advanced Visual Analytics;
- Legacy 2.0, Achievements System, Trophy Room 2.0;
- optional challenge / league / club content;
- Backup and Recovery Experience 2.0 (UX only);
- Cloud Readiness architecture (no runtime);
- Optional Private Cloud Backup;
- Private Account / Identity Layer;
- Private Paired Device Capability;
- Connected Rivalry;
- Private Transfer Challenge device mode;
- private sharing;
- private remote joining / session system (important future requirement after owner clarification 2026-08-16; still BLOCKED — no current auth).

Public community features and global leaderboard/rankings are **ELIMINATED** (owner decision 2026-08-16). Product direction is a private two-manager companion. Do not implement or re-introduce public community or global ranking surfaces unless the owner explicitly reverses that lock in a later roadmap amendment.

None of the future areas above is implementation-authorized by this file today.

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

Local Profile display-label editing, Identity-Safe Career Analytics, and formatVersion 2 full multi-Save backup/import portability (PR #67) are closed and must not be reopened.

No product candidate is currently authorized. After this documentation synchronization is published, advance only a later explicit owner-authorized candidate drawn from the owner roadmap Phase B onward (Save Library / Local Profile Experience 2.0 first). A continuity transition must carry this clean stop forward rather than inventing a new candidate.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

### Bootstrap / study (required first)

1. Independently confirm live `main` is still `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (or a later SHA that preserves the multi-Save + private two-manager locks).
2. Confirm PR #68 (docs/phase-a-multi-save-authority-sync) status: if still open, its only remaining purpose is documentation + contract authority synchronization.
3. Read `AGENTS.md`, `00_HANDOFF_GOLDEN_RULE.md`, `PRODUCT_PHILOSOPHY_LOCK.md`, `PROJECT_STATE.md`, this file, and the owner Full Comprehensive Project Roadmap (Private Two Manager direction).
4. Do not treat any roadmap ordering as implementation authorization.

### Execution (after study)

**Current authorized work:** complete Phase A documentation authority synchronization only.

1. On branch `docs/phase-a-multi-save-authority-sync`, ensure contracts assert the sealed state (multi-Save CLOSED, no product candidate authorized, clean stop until explicit Phase B owner instruction).
2. Push via Path B; confirm PR #68 CI fully green.
3. Report status to owner. Do **not** merge unless the owner explicitly delegates merge.
4. After merge + live main confirmation of the corrected authority files: hold the clean stop.

**Owner direction received 2026-08-16 (this session):** the owner has explicitly instructed continuation toward the next product version based on the roadmap, with visible progress labeling. That instruction authorizes opening Phase B only **after** Phase A (this documentation synchronization) is published. The first Phase B candidate remains Save Library / Local Profile Experience 2.0 unless the owner names a different candidate.

Do not begin Save Library Experience 2.0, Statistics 2.0, cloud, public community, or private remote joining while Phase A is still open. Public community and global leaderboard remain ELIMINATED. Private remote joining remains BLOCKED.
