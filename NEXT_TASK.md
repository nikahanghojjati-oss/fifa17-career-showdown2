# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-12

Application version: v1.1.5
Runtime asset revision: `1.1.5-r1`
Public release status: deployed and independently production-proven twice
Immutable application runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
Proven runtime Pages deployment: `5878930362`

Do not hardcode a mutable `main` SHA here. Read GitHub for the current repository head. Later CI/test/documentation-only commits do not redefine the immutable application runtime.

## v1.1.5 status — CLOSED

v1.1.5 Restore Transaction Safety Maintenance is complete. Candidate A, Candidate B, and Candidate C are complete and protected.

The two maintenance fixes are closed:

1. immutable confirmed restore intent across asynchronous fresh revalidation;
2. transaction-owned rollback with strict exact raw snapshots, exact entry/per-write preconditions, anti-clobber ownership checks, post-write verification, and byte-for-byte owned rollback verification.

Repeated identical restore remains a deterministic zero-write no-op. Corrupt raw bytes remain preserved unless explicit replacement is selected. `js/storage.js` remains sole canonical destructive storage authority.

Cloud identity/revision/conflict/tombstone/privacy/security work remains future-contract-only in `CLOUD_STORAGE_FOUNDATION.md`.

## Immutable release evidence

First exhaustive public proof:

- Stability run `31650134707`, attempt 1;
- deployed smoke job `94293855547`;
- exact byte parity, provenance, Home/Reus, licensed visuals, Candidate A, Candidate B, Candidate C, and complete journey passed.

Second exhaustive public proof:

- optimized Stability run `31651830554`;
- deployed smoke job `94297967413`;
- the same public boundary passed again;
- focused Release Integration Burn-In `31651830507` passed 2/2.

The CI-orchestration checkpoint `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62` is historical CI/test maintenance and changes no application/runtime/assets/data bytes relative to the runtime authority.

## Permanent validation topology

There remain 14 permanent workflow families and 27 protected `.yml` executable blocks. Normal PRs intentionally exercise 13 families because Release Integration Burn-In is main/manual only.

Testing ownership is single-purpose:

- workstream workflows own specialized contracts/browser evidence;
- Candidate B owns one authoritative import-analysis browser run per attempt;
- Candidate C owns one authoritative restore/recovery browser run per attempt;
- local Stability owns one provenance pass plus one full integration journey;
- deployed Stability owns exact bytes + provenance + Home + visuals + Candidate A/B/C + full journey;
- Release Integration Burn-In owns two repeated complete stateful journeys on main/manual release use;
- Markdown-only seals skip heavy Candidate B/C/Stability/Burn-In lanes and rely on Static/release-authority coherence.

Do not restore the old duplicate browser loops, five full Burn-In matrices, or whole-matrix reruns for a single proof. `tests/contracts/ci-orchestration-contracts.cjs` rejects those regressions.

## Immediate legal task

Begin v1.2.0 — Installable Offline App only after loading current `main` and preserving the closed v1.1.5 baseline.

Before writing runtime code:

1. read `00_HANDOFF_GOLDEN_RULE.md`;
2. read `00_DEVELOPER_START_HERE.md`;
3. read `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`;
4. read `PROJECT_STATE.md` and `RELEASE_V1.1.5.md`;
5. read the v1.2 section of `POST_V1_ROADMAP_EXECUTION.md`;
6. inspect current startup/cache identity and storage/recovery boundaries;
7. design service-worker install/activate/update/recovery so incompatible runtime revisions can never mix;
8. keep cloud/account/profile work dependency-blocked.

v1.2 direction:

- web app manifest and original install metadata/icons;
- service worker for versioned first-party shell;
- atomic cache activation;
- visible Update Ready flow;
- offline status and graceful unavailable external media;
- Chromebook/Android install behavior and browser-appropriate guidance elsewhere;
- first-load, repeat-load, offline, update, rollback, and cache-corruption tests;
- two consecutive cache-revision upgrade/rollback proofs before release.

## Protected systems v1.2 must not alter

- exactly two managers;
- Showdown lengths `[1,3,5,10]`;
- same selected league / different permanent clubs;
- max-11 scoring and 0–0-only tiebreak;
- League-confirmation and club-rivalry checkpoints;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations;
- centralized Smart Back/navigation ownership;
- exactly three canonical current localStorage keys;
- Candidate A non-mutating backup format v1;
- Candidate B read-only analysis;
- Candidate C strict exact raw snapshot + transaction-owned rollback semantics;
- protected Marco Reus/football-photo presentation;
- startup budgets;
- local-first behavior.

## CI operating rule

Do not spend development time watching GitHub Actions every few seconds. Start the relevant owner run, record its run ID, continue independent work, and inspect after an appropriate interval. A rerun changes `run_attempt` and can make the UI look like a completed job restarted; use attempt history before calling that a product failure.

When a failure occurs, diagnose first and rerun only the failed/cancelled owner job when possible. Never rerun every permanent workflow because one long job was interrupted.

## Exact continuation command

`Load current main. Read 00_HANDOFF_GOLDEN_RULE.md, 00_DEVELOPER_START_HERE.md, NEXT_TASK.md, CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md, PROJECT_STATE.md and RELEASE_V1.1.5.md. Treat ff755a9863abc843ae9aac45178428e3a104fc65 as immutable v1.1.5 application runtime. Do not infer runtime authority from a later mutable main SHA. Do not reopen Candidate C or v1.1.5 release closure. Do not recreate redundant test loops. Begin only v1.2.0 Installable Offline App while preserving local data-safety and cache-revision integrity. Cloud remains future-contract-only.`