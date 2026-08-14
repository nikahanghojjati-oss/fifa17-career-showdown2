# Career Mode Showdown — Save Library Runtime Authority Cutover Active Handoff

Last updated: 2026-08-13 ET
Status: pre-implementation authority reconstruction complete; runtime authority cutover is the only owner-authorized engineering scope
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Production application/runtime: `v1.3.0` / `1.3.0-r1`
Feature release version: intentionally unassigned

## Verified repository authority

This session independently fetched GitHub `main` before mutation.

Owner handoff reference SHA:

`488e8fd464afddfa9d201e0ca0a57cd8a5cdda6b`

Verified live `main` at session start:

`98b37a4ec77b3da3da55f6f621a6a0cf2a340fa2`

`main` had advanced by two commits through documentation-only PR #50. Comparing the owner handoff SHA with the verified live SHA showed only `00_CURRENT_HANDOFF.md` changed; runtime source did not advance beyond the canonical persistence implementation state.

Implementation branch:

`agent/save-library-runtime-authority-cutover`

Branch base:

`98b37a4ec77b3da3da55f6f621a6a0cf2a340fa2`

No runtime source had been modified when this checkpoint was published.

## Owner-authorized bounded scope

Implement only Save Library runtime authority cutover.

The candidate must make `careerModeShowdown.saveLibrary` the actual authority for the active/in-progress Showdown after the already-proven migration completes, and the retired singleton writer must never recreate `careerModeShowdown.activeShowdown` from the new runtime.

This candidate does not include visible Save Library UI, profile creation UI, profile rename UI, historical profile-mapping UI, cloud/accounts, QR pairing, synchronization, remote transport, gameplay changes, scoring changes, Smart Back changes, protected visual changes, loading-screen changes, Settings install/update redesign, or a feature release-version assignment.

The completed PR #48 migration machinery is a dependency, not a redesign target.

## Required authority read completed

Before source mutation this session read the current repository authority in the owner-specified order:

1. `00_HANDOFF_GOLDEN_RULE.md`
2. `00_DEVELOPER_START_HERE.md`
3. `00_CURRENT_HANDOFF.md`
4. `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`
5. `PROJECT_STATE.md`
6. `NEXT_TASK.md`
7. `V1.3.0_PRODUCTION_PROOF.md`
8. `RELEASE_V1.3.0.md`
9. `CAREER_MODE_SHOWDOWN_V1.3.0_MAINTENANCE_HANDOFF.md`
10. `POST_V1_ROADMAP_EXECUTION.md`

The session also inspected current storage, transaction, foundation, persistence, startup/lazy-loading, gameplay creation/resume, menu, league, club, transfer, Season completion, backup/import/restore, and Save Library persistence contract ownership before implementation.

## Reconstructed current runtime ownership

### Canonical raw storage today

The public production runtime still treats exactly three keys as canonical:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.saveLibrary` is currently addressed only by the completed migration machinery and is not yet runtime save authority.

### `js/storage.js`

`js/storage.js` remains the sole public canonical persistence and destructive mutation authority.

Current singleton runtime functions still read/write `careerModeShowdown.activeShowdown` directly through the storage authority:

- `saveCurrentShowdown()`;
- `scheduleCurrentShowdownSave()`;
- `flushScheduledCurrentShowdownSave()`;
- `loadSavedShowdown()`;
- `clearSavedShowdown()`;
- `hasStoredActiveShowdownData()`;
- `hasSavedShowdown()`.

`archiveShowdown()` still upserts completed Showdowns into `careerModeShowdown.legacyShowdowns` by existing Showdown `id`.

The canonical raw transaction boundary already recognizes all four migration slots and preserves exact expected-byte preconditions, transaction-owned writes, anti-clobber rollback ownership and critical recovery escalation.

Candidate C strict destructive snapshot authority remains `captureCareerModeRawRestoreSnapshot()` and must remain unchanged in ownership.

### Runtime singleton call graph

`js/showdown.js`:

- `createShowdown()` checks singleton presence/load state;
- creates a new Showdown with `id: Date.now()` and no Save Library identity;
- assigns it to `currentShowdown`;
- immediately calls `saveCurrentShowdown()`.

`js/screens.js`:

- Continue calls `resumeSavedShowdown()`;
- resume reads through `loadSavedShowdown()`;
- normalized repairs may call `saveCurrentShowdown()`;
- completed resume may call `archiveShowdown()`;
- every normal screen leave can flush `flushScheduledCurrentShowdownSave()`.

`js/menuExperience.js`:

- main-menu Continue state derives saved Showdown metadata through `loadSavedShowdown()` when no in-memory `currentShowdown` exists.

Gameplay modules keep a deliberately synchronous save facade:

- league selection/confirmation calls `saveCurrentShowdown()`;
- club draw/rivalry confirmation calls `saveCurrentShowdown()`;
- Transfer Challenge creation, deadline/phase changes, drafts and final verdicts call `saveCurrentShowdown()`;
- Season completion pushes the final round, updates status/score, calls `saveCurrentShowdown()`, and on final completion calls `archiveShowdown()`.

This centralized facade is the narrowest safe cutover seam. Gameplay modules should not be rewritten merely to know about Save Library storage.

### Lazy-loading/performance ownership

Production eager startup is already `164967` raw / `37425` gzip against locked ceilings of `165000` raw / `37500` gzip.

`js/saveLibraryFoundation.js` and `js/saveLibraryPersistence.js` are intentionally absent from eager HTML and must remain non-eager.

`js/optionalModules.js` already owns promise-based runtime script loading. Gameplay entry points are asynchronous at the navigation/setup boundary even though gameplay persistence calls remain synchronous after activation.

The intended narrow architecture is therefore to lazy-activate Save Library authority before creation/resume/gameplay mutation, while keeping the post-activation save facade synchronous and fail-closed.

## Completed migration dependency that must remain intact

PR #48 already proves:

- strict exact raw snapshot authority;
- complete in-memory planning before mutation;
- exact expected-byte preconditions;
- all-requested-slot last-moment guards;
- migration order `legacyShowdowns`, `saveLibrary`, unchanged guarded `preferences`, then singleton `activeShowdown` retirement last;
- dual-authority staging verification rather than blind coexistence acceptance;
- ownership-scoped reverse rollback;
- anti-clobber ownership checks;
- exact verification and byte-for-byte rollback verification;
- corruption preservation;
- critical recovery on uncertain ownership;
- retry/interruption idempotence.

Runtime cutover must consume that machinery instead of duplicating it.

## Runtime cutover ownership plan

The implementation must preserve these boundaries:

1. `js/storage.js` remains the only raw localStorage authority.
2. `js/storageTransaction.js` remains the destructive canonical transaction engine.
3. Save Library foundation/runtime orchestration must not access localStorage directly.
4. Save Library foundation/persistence/runtime modules remain lazy rather than eager HTML assets.
5. Runtime activation must complete or verify migration before a singleton-origin Showdown can be accepted as active Save Library state.
6. Once Save Library authority is active, `saveCurrentShowdown()` must write only the currently authoritative Save Library entry using stable `saveId` identity and exact raw preconditions.
7. A runtime write must verify that the in-memory Showdown identity matches the registry `activeSaveId`; mismatch, corrupt registry, dual authority, stale bytes or critical recovery must fail closed.
8. New Showdowns must obtain stable `save_*`, `season_*` and role-specific `profile_*` identity through the existing foundation before the first authoritative write.
9. Existing migrated Showdowns must preserve the identities produced by the migration foundation.
10. Final Season persistence must retain stable `season_*` identity and completion/archive must not create a second active truth.
11. `careerModeShowdown.activeShowdown` must not be recreated by any new-runtime save path after successful migration.
12. A same-version stale tab observing another tab's migration/write must not be allowed to reassert stale singleton or stale Save Library bytes.
13. Candidate A remains non-mutating; Candidate B remains read-only; Candidate C remains the only import stage allowed to mutate restore state and still requires `captureCareerModeRawRestoreSnapshot()`.
14. Cache Storage and Service Worker storage remain application-byte storage only, never user-data authority.

## Backup/import compatibility boundary

The existing backup envelope format is not being redesigned in this candidate.

Candidate A must nevertheless continue to export the authoritative active Showdown after singleton retirement without mutating storage. Any compatibility projection must be read-only and preserve the current envelope contract.

Candidate B remains strictly read-only analysis.

Candidate C's destructive snapshot and mutation contract remains the existing three-slot restore authority. Runtime cutover must account for restored singleton-format backup data by routing it through the already-proven Save Library migration/activation boundary before normal gameplay can write again. Candidate C itself must not be silently broadened into an unreviewed Save Library mutation layer.

## Planned failure classes and regression proof

Focused permanent regression evidence will cover at minimum:

- successful singleton migration followed by runtime save never recreates `activeShowdown`;
- new Showdown creation receives stable Save/Season/manager identity before authoritative persistence;
- Resume/Continue resolves from Save Library authority;
- ongoing league/club/transfer/Season writes update only the authoritative Save Library save;
- completed Showdown persistence and Legacy archive preserve stable identities;
- immediate reload after migration;
- interruption after migration but before first runtime write;
- migration retry and idempotence;
- duplicate-save prevention;
- stable identity preservation across repeated writes;
- same-runtime stale tab attempting to write after another tab migrated;
- cross-tab Save Library drift between read and write;
- exact-byte transaction preconditions;
- last-moment prewrite guards where destructive multi-slot state changes occur;
- anti-clobber rollback ownership;
- corrupt singleton, corrupt Save Library and unverifiable dual-authority states fail closed without overwriting source bytes;
- critical recovery lock remains authoritative;
- Candidate A non-mutating export still contains the authoritative active Showdown;
- Candidate B remains read-only;
- Candidate C strict destructive snapshot ownership and restore transaction behavior remain intact;
- eager performance budgets remain unchanged;
- PWA/runtime boundary and complete stateful journey remain intact.

No existing test or budget may be weakened to make the candidate pass.

## Tool, command and failure record

1. A read-only local clone attempt failed before any mutation because the execution environment could not resolve `github.com`: `fatal: unable to access 'https://github.com/nikahanghojjati-oss/fifa17-career-showdown2.git/': Could not resolve host: github.com`. Classification: execution-environment network/DNS limitation. GitHub connector authority remained healthy, the branch was created through the connector from the exact verified SHA, and no repository state was changed by the failed clone.

2. No CI failure has occurred in this runtime-cutover candidate at the time of this pre-implementation checkpoint.

## Next action from this checkpoint

Implement the smallest coherent runtime authority cutover on this branch, add focused deterministic contracts, run normal repository validation through the existing PR workflows, then update this handoff with every meaningful failure/correction and final exact-head proof before merge.

Do not continue into visible Save Library UI from this candidate.