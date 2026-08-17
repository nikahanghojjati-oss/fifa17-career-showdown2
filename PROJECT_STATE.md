# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-17 ET (Phase C first slice authorized)

This file is the primary owner of current deployed product state. `NEXT_TASK.md` owns implementation authorization; `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/status; release/proof documents remain frozen evidence for the release they name. `00_WORK_ENVIRONMENT_CONTINUITY.md` owns development-environment continuity and does not alter product/runtime authority.

## Development continuity infrastructure

The repository includes the Work Environment Continuity system through `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json`, `WORK_ENVIRONMENT_HISTORY.md` and `scripts/work-environment-continuity.mjs`. It measures only observable development-session signals, leaves unknown usage unknown, includes fresh-environment ramp-up cost and produces a safe-boundary transition alert plus ready-to-paste handoff.

This infrastructure is excluded from the website runtime, Service Worker shell, browser persistence and user interface. It assigns no product candidate and changes none of the production authority below.

## Production authority

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r2`
Immediate previous known-good whole shell: `1.3.0-r1`
Production status: merged, deployed, exact-byte verified and technically production-proven
Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67 formatVersion 2 multi-Save portability)
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70 — Save Library / Local Profile Experience 2.0 first slice)
Validated PR #70 pre-merge head (with 44px touch-target fix): `67163f4a…`
Phase B authority merge: `d5027f575ee416a1ad3f36b61fc09602e8239174` (PR #69)
Current feature release version: intentionally unassigned
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The application milestone remains v1.3.0. Later Local Profiles / Save Library, explicit manager-identity linkage, Identity-Safe Career Analytics, Local Profile display-label editing, formatVersion 2 full multi-Save backup/import portability, and the bounded Phase B Save Library / Local Profile Experience 2.0 first slice advanced production functionality without assigning a new application feature version. Runtime maintenance r2 continues to give the changed Save Library JavaScript/CSS a coherent whole-shell installed-app identity while retaining r1 as the immediate recovery predecessor.

## Completed local identity, Analytics, multi-Save portability and Phase B first slice chain

1. Identity foundation — PR #46.
2. Canonical persistence integration — PR #48.
3. Runtime authority cutover — PR #51.
4. Visible Local Profiles / Save Library Core UI — PR #53.
5. Explicit cross-Save/historical manager identity linkage foundation — PR #57.
6. Identity-Safe Career Analytics / Trophy Room longitudinal consumption — PR #59.
7. Local Profile display-label editing and r2 whole-shell delivery — PR #61, merge `67095a02188ebd246da0d0f2cd61158b8e9e504e`.
8. formatVersion 2 full multi-Save backup/import portability — PR #67, squash-merge `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (owner-accepted 2026-08-16).
9. Phase A documentation authority synchronization — PR #68, squash-merge `372e5570391616efd737fc4780ad0b51d8ec5ce4`.
10. Phase B first slice — Save Library / Local Profile Experience 2.0 (richer cards, clearer Local Profile presentation, local non-destructive sorting) — PR #70, squash-merge `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (2026-08-17).

All ten layers are shipped and production-proven. Do not describe Save Library, stable Local Profile identity, explicit manager linkage, identity-safe longitudinal Career Analytics, display-label editing, complete multi-Save device portability, or the Phase B first-slice presentation improvements as unfinished foundation work.

### Phase B first slice (production-proven 2026-08-17)

- Richer Save cards: status chip (IN PROGRESS / COMPLETED / NOT STARTED) + visual progress bar; Last Played label.
- Clearer Local Profile presentation: link badge (N SAVES LINKED / NO SAVE LINK), isLinked/isOrphan states.
- Local non-destructive sort controls (Last Played · Name · Progress). Active Save always first. Session presentation only — no storage write.
- Touch-target compliance: sort buttons min-height 44px.
- Live Pages confirmed serving updated `css/saveLibrary.css` and `js/saveLibraryUI.js`.
- Validate Stability Lane #757 (main, 65b6c9d) SUCCESS including full `deployed-site-smoke` against production Pages.

## Identity-Safe Career Analytics state

`js/analytics.js` is the Career Analytics calculation authority. Longitudinal manager aggregation uses authoritative stable `profile_*` references rather than normalized visible manager names. Same-name distinct profiles remain distinct; explicit reuse aggregates across Saves; unresolved historical roles remain excluded from identified longitudinal manager totals/leaderboards until explicitly mapped; identity-independent totals and Showdown/Season-scoped records remain complete; display labels remain presentation only; Rivalry Analytics remains Showdown-scoped; identity and profile-presentation changes invalidate Analytics/Trophy Room derived caches coherently.

## Recovery/import state

Candidate A remains non-mutating export.
Candidate B remains strictly read-only analysis.
Candidate C remains the only import stage permitted to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority and must never substitute `captureCareerModeRawBackupInputs()`.

Preserve exact preconditions, last-moment raw guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber verification, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery.

**formatVersion 2 is live.** The backup envelope now serializes the complete Save Library registry (all Saves, stable `save_*` / `profile_*` / season identities, activeSaveId, metadata, explicit reuse, unresolved historical roles) together with Legacy and preferences. Optional projected activeShowdown remains for v1 compatibility. Clean-device restore performs full-restore-clean; existing-data destinations use explicit replace-all under Candidate C; keep-current is the safe path when the library key is omitted. Invalid or corrupt backups are rejected before canonical mutation. Complete fresh-device multi-Save portability is production-proven and closed.

## Installable Offline App state

Whole-shell label remains exactly `1.3.0-r2`.
Preserve Service Worker exactness, versioned cache names, offline shell integrity, and the protected installable surface. Service Worker and offline shell change only when intentionally authorized; they continue to cache first-party bytes only, never canonical user data. Preserve verified cache population, explicit update activation, current/previous whole-shell recovery and installed-app behavior.

## Performance state

Locked ceilings remain unchanged:

- eager raw `162782` <= `165000` bytes
- eager gzip `37416` <= `37500` bytes
- Reus startup portrait `88492` <= `95000` bytes
- combined first-party startup `251274` <= `260000` bytes
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

Identity-Safe Career Analytics, Local Profile display-label editing, formatVersion 2 multi-Save portability and the Phase B first-slice presentation changes do not require an eager Save Library runtime or startup architecture change beyond the already-shipped surface.

## Protected product surfaces and gameplay

Preserve Home, Continue Career, Create Showdown, league confirmation, club confirmation, Transfer Challenge, Season Entry, Season Review, Season Summary, Statistics, Legacy, Trophy Room, Rule Book, Save Library/Settings, Smart Back, PWA/offline, accessibility, responsive containment, installed iOS behavior, licensed football photography and FIFA 17-inspired presentation.

Exactly two managers.
Showdown lengths: `1`, `3`, `5`, `10`.
Same selected league, different permanent clubs.
Champions League +5, League +3, Domestic Cup +1.
100 League Points and/or 100 League Goals combined maximum +1.
Top Scorer and/or Top Assist combined maximum +1.
Maximum Season score 11.
Equal non-zero scores are Draws.
Only 0–0 invokes league position and then league points.

## Permanent product philosophy

Career Mode Showdown is a private two-manager companion for the owner and one friend.
Public community features and global leaderboard/rankings are **ELIMINATED** (owner decision 2026-08-16).
Private remote joining remains an important future requirement but is currently **BLOCKED** (no auth / transport).

## Current authorization boundary

Identity-Safe Career Analytics, Local Profile display-label editing, formatVersion 2 full multi-Save backup/import portability (PR #67), Phase A documentation authority sync (PR #68), and Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70) are complete, merged, deployed and production-proven.

**Authorized product candidate (owner instruction 2026-08-17):** Phase C / Showdown Home & Season Experience deepening — first slice.

Bounded first-slice scope:

1. Richer Showdown Home (dashboard) scoreboard — series lead/trail status chip + clearer visual hierarchy for the current series score.
2. Contextual primary action label on the Home screen that reflects the real next step.
3. Last completed season result summary on the Home screen (when at least one season has been played).
4. Touch-target and spacing polish for primary Home actions (min-height 44px where needed).

Presentation-only. No new canonical storage keys, no mutation of Save Library / profile / season identity semantics, no change to scoring rules. Multi-Save portability, Candidate A/B/C, identity-safe Analytics and performance ceilings remain preserved.

After the Phase C first slice is production-proven, stop and wait for a further explicit owner instruction before expanding Phase C or opening Phase D. Profile merge/delete or generic CRUD, broader Save Library Experience 2.0 expansion, Analytics 2.0, optional content, cloud/network work, public community surfaces and private remote joining remain unauthorized.
