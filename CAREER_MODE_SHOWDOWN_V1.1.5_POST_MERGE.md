# Career Mode Showdown v1.1.5 — Final Post-Merge Release Handoff

Last updated: 2026-08-12
Status: FINAL v1.1.5 RELEASE AUTHORITY AND NEXT-DEVELOPER HANDOFF

## 1. Immutable release identity

Application: `v1.1.5`
Runtime revision: `1.1.5-r1`
Immutable application runtime SHA: `ff755a9863abc843ae9aac45178428e3a104fc65`
Proven runtime Pages deployment: `5878930362`
Historical CI-orchestration checkpoint: `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62`

Do not hardcode a mutable current `main` SHA into release authority. Repository `main` may advance through CI/test/documentation-only commits and Pages may deploy those later heads. Read GitHub when the current repository head or latest deployment is needed. Neither event redefines the immutable v1.1.5 application runtime.

## 2. What v1.1.5 fixed

### Major bug 1 — confirmed intent race

The previous Apply flow could confirm one restore plan but consume later file/choice mutations while asynchronous fresh verification was in progress. v1.1.5 freezes the exact confirmed File, deep-copied choices, and reviewed raw precondition before the first asynchronous boundary, locks the restore decision surface, generation-binds async review, and commits only the confirmed values.

### Major bug 2 — transaction-owned rollback

The previous transaction rolled back every planned affected key rather than only successful mutations. v1.1.5 uses strict exact raw snapshots, entry/per-write byte preconditions, mutation ownership only after successful writes, reverse rollback of owned keys only, anti-clobber ownership checks, byte-for-byte rollback verification, and critical cache invalidation when ownership cannot be proven.

Permanent recovery states:

- `RESTORE NOT STARTED` — zero successful mutation, therefore no rollback;
- `RESTORE ROLLED BACK` — transaction-owned changes restored and verified;
- `CRITICAL RECOVERY STATE` — ownership or rollback uncertain; restore controls lock until refresh.

Repeated identical restore remains a deterministic zero-write no-op. Corrupt raw bytes remain preserved unless explicit replacement is selected.

## 3. Candidate C protected transaction sequence

A legal destructive restore must keep all of the following:

1. flush pending canonical writes;
2. freeze exact confirmed File, choices, and reviewed raw bytes before asynchronous Apply work;
3. freshly revalidate the exact confirmed file through Candidate B authority;
4. capture a strict exact raw snapshot that differentiates true absence from read failure;
5. reject reviewed-state drift;
6. compute complete final values in memory;
7. require explicit active/Legacy/preferences/conflict decisions;
8. enter `js/storage.js` authority with the planning snapshot as precondition;
9. recheck exact raw bytes immediately before every mutation;
10. commit deterministic active → Legacy → preferences order;
11. grant mutation ownership only after a successful write;
12. verify every committed value;
13. on failure roll back only transaction-owned mutations in reverse order;
14. refuse to overwrite newer/unowned bytes;
15. verify owned rollback byte-for-byte;
16. surface critical uncertainty instead of pretending success;
17. invalidate uncertain runtime caches after critical recovery;
18. synchronize runtime/navigation only after complete success;
19. preserve corrupt raw bytes until explicit replacement;
20. keep repeated identical imports zero-write and deterministic.

## 4. Cloud groundwork delivered without cloud runtime

`CLOUD_STORAGE_FOUNDATION.md` defines future-only identity/revision/conflict/tombstone/privacy/security constraints.

Locked future rules include:

- `accountId`, `profileId`, `saveId`, `deviceId`, `installationId`, and object identity are distinct;
- server revision is authoritative; timestamps/content hashes are not mutation authority;
- mutations use `baseRevision`/parent semantics and compare-and-swap;
- divergent heads become explicit conflicts, never silent last-write-wins gameplay state;
- deletion uses tombstones/deletion revisions with anti-resurrection behavior;
- cloud is local-first and opt-in with minimization, export/delete, and retention requirements;
- TLS, authentication, server-side authorization, least privilege, secure token/session handling, replay/idempotency protection, and rate/schema/size limits are mandatory;
- no admin/service secret may ship in static client JavaScript;
- no future cloud module may call localStorage directly;
- downloaded/conflict-resolved state must re-enter the same exact local Candidate C storage/precondition/verification/transaction-owned rollback boundary.

No cloud backend, account requirement, or network mutation was added in v1.1.5.

## 5. Release proof 1

Runtime `ff755a9863abc843ae9aac45178428e3a104fc65` deployed successfully as Pages deployment `5878930362`.

Stability run `31650134707`, attempt 1, is the authoritative first production record. Deployed-site-smoke job `94293855547` passed:

1. exact deployed runtime-byte parity;
2. runtime error provenance;
3. Home/Marco Reus visual audit;
4. licensed crop-safe football-photo audit;
5. Candidate A backup export;
6. Candidate B read-only import analysis;
7. Candidate C destructive restore/recovery;
8. complete public gameplay/navigation journey.

A later rerun reset the visible current job list. It did not invalidate attempt 1. GitHub attempt history preserves finished evidence.

## 6. Why testing appeared to glitch

The repeated waiting/backtracking was test orchestration, not application instability.

Root causes:

1. local Stability serialized seven browser suites and repeated the whole set twice;
2. Candidate B and Candidate C duplicated their already multi-scenario specialist suites;
3. Burn-In launched five copies of nearly the complete release matrix;
4. documentation-only work could relaunch heavy browser lanes;
5. frequent short polling created wait/status noise without advancing development;
6. rerun concurrency could cancel an active Stability proof;
7. GitHub displays the latest run attempt, so a rerun can make a finished workflow look as if it restarted.

Never call a cancelled or visually reset workflow an application failure before checking event, `run_attempt`, exact job conclusion, and concurrency history.

## 7. CI orchestration remedy

CI-only PR #26 was validated and merged as immutable checkpoint `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62`. No application runtime file changed.

The protected model now uses single-owner evidence:

- Candidate B runs one authoritative browser analysis per workflow attempt;
- Candidate C runs one authoritative restore/recovery browser suite per workflow attempt;
- local Stability runs one runtime-provenance audit plus one complete integration journey;
- deployed Stability remains exhaustive with exact bytes + provenance + Home + visuals + Candidate A + Candidate B + Candidate C + complete journey;
- Release Integration Burn-In is main/manual only and runs two stateful complete journeys, not five copies of the full release matrix;
- heavy Candidate B/C/Stability/Burn-In workflows ignore Markdown-only changes;
- fresh attempt-1 PR/push runs may cancel stale work;
- deliberate reruns and `workflow_dispatch` queue instead of cancelling an already-running proof;
- specialized evidence has one workflow owner;
- `tests/contracts/ci-orchestration-contracts.cjs` rejects regression to the old duplicate model.

Measured result:

- old local Stability browser step: about 6m47s;
- optimized canonical Stability browser step: about 1m11s;
- approximately 82% lower wall time for that job;
- affected normal-PR long-suite command invocations: historically 53 → now 4.

The speed improvement came from removing duplicate ownership, not weakening unique assertions, Candidate C failure scenarios, startup budgets, or the exhaustive public release boundary.

## 8. Release proof 2 after CI optimization

Optimized Stability run `31651830554` passed canonical local provenance/integration and the exhaustive deployed-site smoke.

Deployed smoke job `94297967413` passed the same eight public boundaries as proof 1: exact bytes, provenance, Home, licensed visuals, Candidate A, Candidate B, Candidate C, and complete public journey.

Focused Release Integration Burn-In run `31651830507` passed 2/2 stateful integration journeys.

Because the CI-only merge changes no runtime files, this is an independent second production proof of the same application runtime `ff755a9863abc843ae9aac45178428e3a104fc65`.

## 9. How to test without recreating the wait loop

1. choose the workflow that owns the changed behavior;
2. record the run ID once;
3. continue independent work instead of polling every few seconds;
4. inspect after realistic wall time or a real failure signal;
5. use job logs/annotations before rerunning;
6. rerun only the failed/cancelled owner job when possible;
7. never rerun the entire permanent matrix merely to duplicate one proof;
8. for release repetition, repeat canonical deployed Stability proof rather than every specialist lane;
9. if GitHub appears to go backward after rerun, inspect `run_attempt` and attempt history;
10. do not modify a frozen runtime while evidence is being collected;
11. keep documentation-only seals Markdown-only so heavy browser lanes remain skipped.

## 10. Protected validation structure

There are 14 permanent workflow families and 27 protected executable `.yml` blocks. Normal PRs intentionally exercise 13 families because Release Integration Burn-In is main/manual only.

Static App remains the broad deterministic/release-authority/coherence guard. Candidate B and Candidate C own specialist browser evidence. Stability owns canonical integration and exhaustive deployed smoke. Burn-In owns repeated stateful integration.

Do not weaken startup limits or unique assertions for speed. The remedy is non-duplicative ownership.

## 11. Documentation authority

`CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md` is detailed development chronology. Its pre-merge status statements are historical. This file is the current v1.1.5 closure handoff.

Mutable repository heads and later docs-only Pages deployments must never redefine `ff755a9863abc843ae9aac45178428e3a104fc65` as application runtime authority.

## 12. Next legal substantive milestone

v1.2.0 — Installable Offline App.

The first design question is not merely how to register a service worker. It is how install/update/rollback/cache corruption preserve v1.1.5 data-safety and runtime-revision guarantees.

Required v1.2 themes:

- manifest/install metadata;
- original icons/theme metadata;
- versioned first-party service-worker shell cache;
- atomic cache activation;
- visible Update Ready flow;
- offline status and graceful external-media absence;
- Chromebook/Android install behavior;
- first-load/repeat-load/offline/update/rollback/cache-corruption tests;
- two consecutive cache-revision upgrade/rollback proofs before release.

v1.3 stable local profiles/save identity comes later. Cloud Readiness and Cloud Backup remain later still.

## 13. Exact next-developer orientation

`v1.1.5 / 1.1.5-r1 is closed, deployed and twice production-proven. Immutable application runtime is ff755a9863abc843ae9aac45178428e3a104fc65. Mutable main/docs SHAs are read from GitHub and are not runtime authority. Candidate A/B/C are complete. The two maintenance fixes are immutable confirmed restore intent and transaction-owned rollback with strict exact raw snapshots/preconditions/verification. The duplicated CI loop is retired and must not be recreated. Cloud remains future-contract-only. Begin v1.2.0 Installable Offline App without reopening v1.1.5.`