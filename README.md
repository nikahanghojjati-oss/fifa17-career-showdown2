# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript, browser localStorage and a first-party Installable Offline App shell.

Current production application milestone: v1.5.0 — Private Connected Account Foundation
Current production runtime: `1.5.0-r2` — production-proven
Current production rollback knowledge: `1.5.0-r1`
Active release candidate: **v1.6.0 — Registered Devices & Private Pairing** / `1.6.0-r1` — not production-proven
Candidate immediate recovery target: `1.5.0-r2`
Current shipped product layer: production Connected Account foundation on top of the protected local Save Library / Showdown Home product
Current runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (multi-Save); Phase B `65b6c9db…`; Phase C `dec1d3ba…`
Production release status: v1.5.0 merged, deployed, and production-proven; `1.5.0-r2` is the immediate known-good whole-shell recovery target for the v1.6.0 candidate
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

v1.5.0 established the production private Connected Account foundation while preserving local-first startup, session-only Google authentication, memory-only Firestore, Firebase UID account identity, zero billing and App Check enforcement OFF. The completed v1.4.0 Product Deepening milestone, v1.3.0 Recovery & Device Resilience baseline, formatVersion 2 portability, identity-safe Analytics and private two-manager locks remain protected.

`1.5.0-r2` is the current production-proven whole shell and the rollback target for the Stage 3 candidate. Stage 3 does not reopen the already-proven Connected Account setup and does not authorize billing, public discovery, shared gameplay state or Remote Joining sessions.

PR #124 `Add zero-billing Spark account bootstrap foundation`, PR #125 `Ship Spark private connected account runtime`, and the subsequent v1.5.0 production proof chain are completed prerequisite history. They must not be treated as current implementation work.

PR #129 `v1.6.0 Stage 3: Registered Devices / Private Pairing` is the active bounded release candidate. It adds stable private installation/device identity in IndexedDB, authenticated self-device registration/revocation, a 256-bit short-lived one-use private pairing capability, and exactly two manager slots bound to stable account/profile/save identities. The provider boundary remains Firebase Spark with memory-only Firestore, no Cloud Run/Functions/Storage/Blaze, App Check enforcement OFF, and no shared gameplay/session writes.

Current verified source wins over stale historical status prose. Technical production proof does not fabricate owner visual acceptance.

## Development entry point

Read in this order:

1. `AGENTS.md`
2. `00_HANDOFF_GOLDEN_RULE.md`
3. `00_WORK_ENVIRONMENT_CONTINUITY.md`
4. `WORK_ENVIRONMENT_STATUS.json`
5. `WORK_ENVIRONMENT_HISTORY.md`
6. `00_DEVELOPER_START_HERE.md`
7. `00_CURRENT_HANDOFF.md`
8. `PROJECT_STATE.md`
9. `NEXT_TASK.md`
10. `PRODUCT_PHILOSOPHY_LOCK.md`
11. `REMOTE_JOINING_PRIORITY_AMENDMENT_2026-08-17.md`
12. `LOCAL_PROFILES_SAVE_LIBRARY_ACTIVE_HANDOFF.md`
13. `VISIBLE_SAVE_LIBRARY_UI_ACTIVE_HANDOFF.md`
14. current `RELEASE_V*.md` candidate/production record selected from the runtime revision
15. `CAREER_MODE_SHOWDOWN_V1.4.0_MAINTENANCE_HANDOFF.md`
16. `V1.3.0_R2_PRODUCTION_PROOF.md` for historical frozen production evidence
17. `POST_V1_ROADMAP_EXECUTION.md`

Always fetch live `main` before relying on a SHA in documentation.

Run `npm run work:continuity:validate` and `npm run work:assess` after bootstrap and at the protocol's meaningful checkpoints. The Work Environment Continuity system records observable context and reliability signals, uses only explicit usage evidence, weighs fresh-environment ramp-up cost and generates `npm run work:handoff` output when a safe transition is preferable. It is repository development infrastructure and is not included in the website runtime.

Older release/proof documents remain immutable rollback/history evidence for their own runtimes.

## Locked product model

Career Mode Showdown is a rivalry companion, not a browser football simulator. The private Connected Account foundation is production-proven; Registered Devices / Private Pairing is the active bounded candidate, while Connected Rivalry and actual Remote Joining remain dependency-gated downstream.

- exactly two managers;
- multiple local Showdown Saves supported by the Save Library;
- at most one explicit active Save selected by `activeSaveId`;
- manual FIFA 17 result entry;
- one selected league for both managers;
- different permanent clubs;
- Showdown lengths 1 / 3 / 5 / 10;
- Champions League +5, domestic League +3, main domestic Cup +1;
- 100 League Points and/or 100 League Goals share one +1 performance bonus;
- Top Scorer and/or Top Assist share one +1 awards bonus;
- maximum Season score 11;
- equal non-zero scores are Draw;
- only 0–0 uses league position then league points as tiebreakers.

## Local Profiles / Save Library product

The production application includes a lazy FIFA 17-inspired local Save Library inside the established Settings navigation/focus owner.

The completed dependency chain includes identity foundation, canonical persistence, runtime authority cutover, visible Save Library UI, explicit manager identity, Identity-Safe Career Analytics, Local Profile display-label editing, formatVersion 2 multi-Save portability (PR #67), Phase B first slice (PR #70), and Phase C first slice (PR #73).

Stable prefixes remain `save_*`, `season_*` and `profile_*`. Display names are labels, never identity keys.

## Architecture and data safety

Navigation/history/Smart Back authority: `js/screens.js`.
Public raw browser-storage authority: `js/storage.js`.
Raw transaction engine: `js/storageTransaction.js`.
Save Library runtime mutation authority: `js/saveLibraryRuntime.js`.
Analytics authority: `js/analytics.js`.

Public canonical localStorage keys after cutover:
1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is not a fourth permanent canonical key after cutover. It remains migration/recovery compatibility input only.

Stage 3 private device identity is intentionally stored outside canonical localStorage in IndexedDB. It does not become gameplay save authority and clearing it must not delete local Showdown saves.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C is the only destructive import Apply stage.

Candidate C preserves immutable confirmed intent, strict exact raw snapshot/precondition authority through `captureCareerModeRawRestoreSnapshot()`, last-moment exact-byte guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber ownership, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery on uncertainty. These recovery guarantees remain binding beneath v1.5.0 production and the v1.6.0 candidate and must not be weakened by Remote Joining prerequisite work.

Service Worker and Cache Storage own application bytes only and never canonical user data.

## Installable Offline App

Current production whole shell: `1.5.0-r2` — production-proven.
Production fallback/recovery knowledge: `1.5.0-r1`.
Current release candidate shell: `1.6.0-r1`, with `1.5.0-r2` as its immediate previous known-good whole shell.

- version-owned first-party Service Worker shell;
- complete verified cache population;
- explicit Update Ready activation at safe boundaries;
- current/previous-known-good recovery preserved across release revisions;
- Firebase account connectivity remains optional and must never become an offline/local startup dependency.

## Current continuation boundary

The production private Connected Account foundation is complete under **v1.5.0 / 1.5.0-r2**.

**PR #129 / v1.6.0-r1 is the current bounded product candidate.** Its deterministic contracts, desktop/mobile IndexedDB identity audits and Firestore Rules emulator proof must remain green on one exact head. Production Firestore Rules must not be advanced until the exact candidate source gates are clean. After provider publication proof, merge/deploy may proceed under standing owner authorization, followed by post-deployment proof before promotion to production-proven.

Public community / global leaderboard remain **ELIMINATED**. Public discovery, public profiles, public matchmaking, public invite directories and public lobbies remain prohibited.

Private Remote Joining remains **PRIORITIZED LONG-TERM / DEPENDENCY-GATED**. Stage 3 Registered Devices / Private Pairing is the active prerequisite; Connected Rivalry is next only after Stage 3 is fully proven, and actual Private Remote Joining remains downstream of Connected Rivalry.

PR #37 and PR #35 remain historical draft work and are not current authority.
