# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-16 ET

This file is the primary owner of current deployed product state. `NEXT_TASK.md` owns implementation authorization; `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/status; release/proof documents remain frozen evidence for the release they name. `00_WORK_ENVIRONMENT_CONTINUITY.md` owns development-environment continuity and does not alter product/runtime authority.

## Development continuity infrastructure

The repository includes the Work Environment Continuity system through `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json`, `WORK_ENVIRONMENT_HISTORY.md` and `scripts/work-environment-continuity.mjs`. It measures only observable development-session signals, leaves unknown usage unknown, includes fresh-environment ramp-up cost and produces a safe-boundary transition alert plus ready-to-paste handoff.

This infrastructure is excluded from the website runtime, Service Worker shell, browser persistence and user interface. It assigns no product candidate and changes none of the production authority below.

## Production authority

Application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.3.0-r2`
Immediate previous known-good whole shell: `1.3.0-r1`
Production status: merged, deployed, exact-byte verified and technically production-proven
Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27`
Validated PR #67 pre-merge head: `a58a471b8e7199cd4a29f5096de87709b7655ae8`
Current feature release version: intentionally unassigned
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The application milestone remains v1.3.0. Later Local Profiles / Save Library, explicit manager-identity linkage, Identity-Safe Career Analytics, Local Profile display-label editing, and formatVersion 2 full multi-Save backup/import portability advanced production functionality without assigning a new application feature version. Runtime maintenance r2 continues to give the changed Save Library JavaScript/CSS a coherent whole-shell installed-app identity while retaining r1 as the immediate recovery predecessor.

## Completed local identity, Analytics and multi-Save portability chain

1. Identity foundation — PR #46.
2. Canonical persistence integration — PR #48.
3. Runtime authority cutover — PR #51.
4. Visible Local Profiles / Save Library Core UI — PR #53.
5. Explicit cross-Save/historical manager identity linkage foundation — PR #57.
6. Identity-Safe Career Analytics / Trophy Room longitudinal consumption — PR #59.
7. Local Profile display-label editing and r2 whole-shell delivery — PR #61, merge `67095a02188ebd246da0d0f2cd61158b8e9e504e`.
8. formatVersion 2 full multi-Save backup/import portability — PR #67, squash-merge `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (owner-accepted 2026-08-16).

All eight layers are shipped and production-proven. Do not describe Save Library, stable Local Profile identity, explicit manager linkage, identity-safe longitudinal Career Analytics, display-label editing, or complete multi-Save device portability as unfinished foundation work.

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
Previous known-good whole shell remains `1.3.0-r1`.

Service Worker and Cache Storage own application bytes only, never canonical user data. Preserve verified cache population, explicit update activation, current/previous whole-shell recovery and installed-app behavior.

## Performance state

Locked ceilings remain unchanged:

- eager raw `162782` <= `165000` bytes
- eager gzip `37416` <= `37500` bytes
- Reus startup portrait `88492` <= `95000` bytes
- combined first-party startup `251274` <= `260000` bytes
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

Identity-Safe Career Analytics, Local Profile display-label editing and formatVersion 2 multi-Save portability do not require an eager Save Library runtime or startup architecture change beyond the already-shipped surface.

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

## Current clean boundary

Identity-Safe Career Analytics, Local Profile display-label editing, and formatVersion 2 full multi-Save backup/import portability (PR #67) are complete, merged, deployed, production-proven and owner-accepted.

No product candidate is currently authorized for implementation. The next product candidate requires a fresh explicit owner instruction selecting from the owner roadmap Phase B onward (Save Library / Local Profile Experience 2.0 first). Profile merge/delete or generic CRUD, broader Analytics 2.0, optional content, cloud/network work, public community surfaces and private remote joining remain unauthorized.
