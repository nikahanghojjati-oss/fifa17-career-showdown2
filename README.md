# Career Mode Showdown

A lightweight two-player FIFA 17 Career Mode rivalry companion built for GitHub Pages with plain HTML, CSS, JavaScript, browser localStorage and a first-party Installable Offline App shell.

Current production application milestone: v1.6.0 — Registered Devices & Private Pairing
Current production runtime: `1.6.0-r1` — production-proven
Active release candidate: **v1.7.0 — Connected Rivalry** / `1.7.0-r1` — not production-proven
Candidate immediate recovery target: `1.6.0-r1`
Remote Joining readiness: `69/100` under fixed model `RJR-1`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

v1.6.0 completed the production Registered Devices / Private Pairing prerequisite on top of the already-proven private Connected Account foundation. Stable private browser-device identity, exactly-two-manager pairing and the zero-billing Firebase Spark provider boundary are production-proven. App Check enforcement remains OFF, Firestore persistent cache remains disabled, Google authentication remains popup-only with `browserSessionPersistence`, and no additional Google OAuth scopes are requested.

v1.7.0 is the current bounded Stage 4 Connected Rivalry candidate. It adds direct exact-rivalry authoritative shared-gameplay state, compare-and-swap revisions, idempotency replay protection and the narrow Firestore authorization needed by exactly the two paired managers. It does not implement Stage 5 Remote Joining sessions or allow remote payloads to overwrite canonical local saves.

Current verified source wins over stale historical status prose. Source code, documentation, emulator proof and green CI do not by themselves increase Remote Joining readiness or promote a candidate to production-proven.

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
15. current `CAREER_MODE_SHOWDOWN_V*_MAINTENANCE_HANDOFF.md`
16. `V1.3.0_R2_PRODUCTION_PROOF.md` for historical frozen production evidence
17. `POST_V1_ROADMAP_EXECUTION.md`

Always fetch live `main` before relying on a SHA in documentation.

Run `npm run work:continuity:validate` and `npm run work:assess` after bootstrap and at the protocol's meaningful checkpoints. The Work Environment Continuity system records observable context and reliability signals, uses only explicit usage evidence, weighs fresh-environment ramp-up cost and generates `npm run work:handoff` output when a safe transition is preferable. It is repository development infrastructure and is not included in the website runtime.

Older release/proof documents remain immutable rollback/history evidence for their own runtimes.

## Locked product model

Career Mode Showdown is a rivalry companion, not a browser football simulator. The production private Connected Account and Registered Devices / Private Pairing foundations are complete. Connected Rivalry is the current bounded prerequisite, while actual Private Remote Joining remains dependency-gated downstream.

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

Public community features and global leaderboard/rankings are ELIMINATED. Public discovery, public profiles, public matchmaking, public invitation directories and public lobbies remain prohibited.

## Local Profiles / Save Library product

The production application includes a lazy FIFA 17-inspired local Save Library inside the established Settings navigation/focus owner.

The completed dependency chain includes identity foundation, canonical persistence, runtime authority cutover, visible Save Library UI, explicit manager identity, Identity-Safe Career Analytics, Local Profile display-label editing, formatVersion 2 multi-Save portability, Phase B Save Library / Local Profile Experience 2.0 first slice, and Phase C Showdown Home & Season Experience first slice.

Stable prefixes remain `save_*`, `season_*` and `profile_*`. Display names are labels, never identity keys.

## Architecture and data safety

Navigation/history/Smart Back authority: `js/screens.js`.
Public raw browser-storage authority: `js/storage.js`.
Raw transaction engine: `js/storageTransaction.js`.
Save Library runtime mutation authority: `js/saveLibraryRuntime.js`.
Analytics authority: `js/analytics.js`.
Connected Rivalry network boundary: `js/sparkConnectedRivalry.js`.

Public canonical localStorage keys after cutover:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

`careerModeShowdown.activeShowdown` is not a fourth permanent canonical key after cutover. It remains migration/recovery compatibility input only.

Private device identity and Connected Rivalry convenience metadata are intentionally stored outside canonical localStorage in IndexedDB. They do not become gameplay save authority, and clearing them must not delete local Showdown saves.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C is the only destructive import Apply stage.

Candidate C preserves immutable confirmed intent, strict exact raw snapshot/precondition authority through `captureCareerModeRawRestoreSnapshot()`, last-moment exact-byte guards, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber ownership, exact post-write verification, byte-for-byte rollback verification, corrupt-byte preservation, retry/idempotence and critical recovery on uncertainty. These recovery guarantees remain binding beneath the v1.7.0 Connected Rivalry candidate.

The first Stage 4 slice may project and publish the explicitly connected active Save and may read remote authoritative state, but it does not directly Apply remote bytes back into canonical local Save Library storage.

Service Worker and Cache Storage own application bytes only and never canonical user data.

## Installable Offline App

Current production whole shell: `1.6.0-r1` — production-proven.
Current release candidate shell: `1.7.0-r1`, with `1.6.0-r1` as its immediate previous known-good whole-shell recovery target.

- version-owned first-party Service Worker shell;
- complete verified cache population;
- explicit Update Ready activation at safe boundaries;
- current/previous-known-good recovery preserved across release revisions;
- Firebase account connectivity and Connected Rivalry remain optional to local startup;
- provider failure must never produce a mixed-version shell or mutate local saves.

Completed resilience baseline — v1.3.0 Recovery & Device Resilience Hardening — remains protected.

## Stage 4 Connected Rivalry contract

Shared authoritative gameplay state uses only `rivalries/{rivalryId}/state/authoritative`. Idempotency receipts live beneath that exact state. Rivalry access remains direct exact-get only; client list/discovery remains denied.

The client `baseRevision` is immutable across retries. Accepted writes advance exactly one monotonic revision. Stale base revisions return explicit conflicts and are never silently rebased. Last-writer-wins behavior is prohibited.

A first accepted idempotent mutation atomically writes the authoritative state and its receipt. An exact accepted replay returns the previously recorded accepted result without another mutation or revision increment. Reusing the same key with a different request fingerprint conflicts.

Shared-state mutation requires the active paired rivalry, exactly two authorized manager accounts, both accounts active, and the writer's registered device active. Tombstoned state cannot be resurrected by this candidate.

Stage 5 Remote Joining session documents remain write-denied. No host/join session orchestration, presence, public lobby or session discovery belongs in v1.7.0-r1.

## Current continuation boundary

`v1.6.0 / 1.6.0-r1` remains production authority.

`v1.7.0 / 1.7.0-r1` is the current bounded Connected Rivalry release candidate. The required order is exact-head source/CI proof → clean reviews/threads/mergeability → publish and verify exactly the reviewed Stage 4 `firestore.spark.rules` → merge/deploy under standing owner authorization → real production Connected Rivalry proof.

No production Rules publication should occur before the immutable source checkpoint is clean. Only genuine production capability proof may move `REMOTE_JOINING_READINESS.json` above `69/100`.

Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED. Stage 4 Connected Rivalry must be production-proven before Stage 5 actual Remote Joining session orchestration begins.

PR #37 and PR #35 remain historical draft work and are not current authority.
