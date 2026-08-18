# PROJECT STATE — Career Mode Showdown

Last updated: 2026-08-17 ET (Remote Joining priority clarification after v1.4.0 seal)

This file is the primary owner of current deployed product state. `NEXT_TASK.md` owns implementation authorization; `POST_V1_ROADMAP_EXECUTION.md` owns dependency direction/status; release/proof documents remain frozen evidence for the release they name. `00_WORK_ENVIRONMENT_CONTINUITY.md` owns development-environment continuity and does not alter product/runtime authority.

## Development continuity infrastructure

The repository includes the Work Environment Continuity system through `AGENTS.md`, `00_WORK_ENVIRONMENT_CONTINUITY.md`, `WORK_ENVIRONMENT_STATUS.json`, `WORK_ENVIRONMENT_HISTORY.md` and `scripts/work-environment-continuity.mjs`. It measures only observable development-session signals, leaves unknown usage unknown, includes fresh-environment ramp-up cost and produces a safe-boundary transition alert plus ready-to-paste handoff.

This infrastructure is excluded from the website runtime, Service Worker shell, browser persistence and user interface. It assigns no product candidate and changes none of the production authority below.

## Production authority

Application milestone: **v1.4.0 — Product Deepening**
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Installable Offline App runtime label: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`
Production status: merged, deployed, and production-proven (Phase C product + this authority/version seal)
Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67 formatVersion 2 multi-Save portability)
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70)
Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6` (PR #73)
Current feature release version: **v1.4.0** (visible on public site footer + `app-asset-revision` meta)
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

The application milestone is now v1.4.0. Phase B (Save Library Experience 2.0 first slice) and Phase C (Showdown Home first slice) are the product-deepening content covered by this formal version. Runtime `1.4.0-r1` gives the updated shell a coherent installed-app identity while retaining `1.3.0-r2` as the immediate recovery predecessor.

The 2026-08-17 Remote Joining priority amendment changes long-term roadmap priority only. It does not change deployed runtime behavior and does not authorize a networked product candidate.

## Completed local identity, Analytics, multi-Save portability, Phase B and Phase C chain

1. Identity foundation — PR #46.
2. Canonical persistence integration — PR #48.
3. Runtime authority cutover — PR #51.
4. Visible Local Profiles / Save Library Core UI — PR #53.
5. Explicit cross-Save/historical manager identity linkage foundation — PR #57.
6. Identity-Safe Career Analytics / Trophy Room longitudinal consumption — PR #59.
7. Local Profile display-label editing and r2 whole-shell delivery — PR #61.
8. formatVersion 2 full multi-Save backup/import portability — PR #67, squash-merge `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (owner-accepted 2026-08-16).
9. Phase A documentation authority synchronization — PR #68.
10. Phase B first slice — Save Library / Local Profile Experience 2.0 — PR #70, squash-merge `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (2026-08-17).
11. Phase C first slice — Showdown Home & Season Experience deepening — PR #73, squash-merge `dec1d3ba8182c3f62019974dd1704c7c9124def6` (2026-08-17).

All eleven layers are shipped and production-proven.

### Phase C first slice (production-proven 2026-08-17)

- Series lead/trail status chip on Home scoreboard + clearer visual hierarchy.
- Contextual primary action (VIEW COMPLETED SHOWDOWN when applicable).
- Last completed season result summary on Home (presentation-only).
- Phase C Home styles injected from `js/showdownUI.js` (eager CSS ceilings preserved).
- Touch-target polish where required.

## Identity-Safe Career Analytics state

`js/analytics.js` is the Career Analytics calculation authority. Longitudinal manager aggregation uses authoritative stable `profile_*` references rather than normalized visible manager names. Same-name distinct profiles remain distinct; explicit reuse aggregates across Saves; unresolved historical roles remain excluded from identified longitudinal manager totals/leaderboards until explicitly mapped; identity-independent totals and Showdown/Season-scoped records remain complete; display labels remain presentation only; Rivalry Analytics remains Showdown-scoped; identity and profile-presentation changes invalidate Analytics/Trophy Room derived caches coherently.

## Recovery/import state

Candidate A remains non-mutating export.
Candidate B remains strictly read-only analysis.
Candidate C remains the only import stage permitted to mutate canonical restore state.

Candidate C destructive Apply still requires `captureCareerModeRawRestoreSnapshot()` as strict exact raw snapshot authority and must never substitute `captureCareerModeRawBackupInputs()`. Preserve transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact post-write verification and byte-for-byte rollback verification.

**formatVersion 2 is live.** Complete fresh-device multi-Save portability is production-proven and closed.

## Installable Offline App state

Whole-shell label is exactly `1.4.0-r1`.
Preserve Service Worker exactness, versioned cache names, offline shell integrity, and the protected installable surface. Service Worker and offline shell change only when intentionally authorized; they continue to cache first-party bytes only, never canonical user data. Preserve verified cache population, explicit update activation, current/previous whole-shell recovery and installed-app behavior.

## Performance state

Locked ceilings remain unchanged:

- eager raw `162782` <= `165000` bytes
- eager gzip `37416` <= `37500` bytes
- Reus startup portrait `88492` <= `95000` bytes
- combined first-party startup `251274` <= `260000` bytes
- normal loading minimum `2700 ms`
- reduced-motion loading `220 ms`

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
Private Remote Joining is a **PRIORITIZED LONG-TERM** product destination (owner clarification 2026-08-17). It is **DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**, not deprioritized or permanently blocked.

The ordered enabling path preserves the shipped local baseline, then advances Cloud/sync readiness, private identity/auth, paired-device/private-session capability, Connected Rivalry synchronization and two-device recovery/conflict proof before the Remote Joining experience itself. When future networked work is authorized, the next safe prerequisite on that path should be preferred over unrelated optional expansion unless a later owner instruction overrides the priority.

## Current authorization boundary

Identity-Safe Career Analytics, Local Profile display-label editing, formatVersion 2 full multi-Save backup/import portability (PR #67), Phase A documentation authority sync (PR #68), Phase B first slice (PR #70), and Phase C first slice (PR #73) are complete, merged, deployed and production-proven.

**No product candidate is currently authorized.** The Remote Joining priority amendment does not itself authorize cloud, identity, pairing, sync or Remote Joining runtime work. Hold clean stop until a further explicit owner instruction establishes one bounded implementation candidate.
