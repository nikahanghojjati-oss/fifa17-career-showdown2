# Career Mode Showdown v1.1.5 — Post-Merge Release and CI Handoff

Last updated: 2026-08-12
Status: FINAL v1.1.5 RELEASE AUTHORITY AND NEXT-DEVELOPER HANDOFF

## 1. Immutable release identity

Application: `v1.1.5`
Runtime revision: `1.1.5-r1`
Immutable application runtime SHA: `ff755a9863abc843ae9aac45178428e3a104fc65`
GitHub Pages deployment: `5878930362`
Later CI/test-only main head: `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62`

Do not confuse the runtime SHA with the later repository head. The compare from `ff755a9863abc843ae9aac45178428e3a104fc65` to `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62` contains only workflow/test files. No HTML, CSS, JavaScript runtime, data, or asset byte changed. Therefore `ff755a9863abc843ae9aac45178428e3a104fc65` remains application authority.

## 2. What v1.1.5 fixed

### Major bug 1 — confirmed intent race

The previous Apply flow could confirm one restore plan but consume later file/choice mutations while asynchronous fresh verification was in progress. v1.1.5 freezes the exact confirmed File, deep-copied choices, and reviewed raw precondition before the first asynchronous boundary, locks the restore decision surface, generation-binds async review, and commits only the confirmed values.

### Major bug 2 — rollback ownership

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

`CLOUD_STORAGE_FOUNDATION.md` defines future-only identity/revision/conflict/tombstone/privacy/security constraints. Important locked future rules:

- `accountId`, `profileId`, `saveId`, `deviceId`, `installationId`, and object identity are distinct;
- server revision is authoritative; timestamps/content hashes are not mutation authority;
- mutations use `baseRevision`/parent semantics and compare-and-swap;
- divergent heads become explicit conflicts, never silent last-write-wins gameplay state;
- deletion uses tombstones/deletion revisions with anti-resurrection behavior;
- cloud is local-first and opt-in with minimization, export/delete, and retention requirements;
- TLS, authentication, server-side authorization, least privilege, secure token/session handling, replay/idempotency protection, and rate/schema/size limits are mandatory;
- no admin/service secret may ship in static client JavaScript;
- no future cloud module may call localStorage directly;
- downloaded or conflict-resolved state must re-enter the same exact local Candidate C storage/precondition/verification/ownership rollback boundary.

No cloud backend, account requirement, or network mutation was added in v1.1.5.

## 5. Release proof 1

Runtime `ff755a9863abc843ae9aac45178428e3a104fc65` deployed successfully as Pages deployment `5878930362`.

Stability run `31650134707`, attempt 1, is the authoritative first production record. Its deployed-site-smoke job `94293855547` passed:

1. exact deployed runtime-byte parity;
2. runtime error provenance;
3. Home/Marco Reus visual audit;
4. licensed crop-safe football-photo audit;
5. Candidate A backup export;
6. Candidate B read-only import analysis;
7. Candidate C destructive restore/recovery;
8. complete public gameplay/navigation journey.

A later rerun reset the visible current job list. It did not invalidate attempt 1. GitHub attempt history preserves the finished evidence.

## 6. Why testing appeared to glitch

The repeated waiting/backtracking was primarily test orchestration, not application instability.

Root causes found:

1. local Stability serialized seven browser suites, then repeated that whole set twice;
2. Candidate B separately repeated its already multi-scenario browser suite twice;
3. Candidate C separately repeated its deep recovery suite twice;
4. Burn-In launched five parallel copies of nearly the complete release matrix, including specialized tests already owned elsewhere;
5. documentation/release-seal commits could launch those heavy browser lanes again;
6. frequent 10–25 second polling generated a large stream of wait/status calls without advancing development;
7. Stability had `cancel-in-progress: true` for a PR concurrency group that did not distinguish deliberate reruns. Rerunning older Stability run 461 as attempt 2 while newer run 462 was active cancelled the newer Chromium proof. The tests did not fail; GitHub cancelled the run;
8. GitHub displays the latest run attempt, so a rerun can make a previously completed workflow appear to restart from the beginning.

The key diagnostic rule is now permanent: never call a cancelled or visually reset workflow an application failure before checking event, `run_attempt`, exact job conclusion, and concurrency history.

## 7. CI orchestration remedy

CI-only PR #26 was validated and merged as `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62`. Its validated PR head was `36b3157073c999933e45482016e4427c165700ac`.

No application runtime file changed.

The new model:

- Candidate B runs one authoritative browser analysis per workflow attempt;
- Candidate C runs one authoritative restore/recovery browser suite per workflow attempt;
- local Stability runs one runtime-provenance audit plus one complete integration journey;
- deployed Stability remains exhaustive with exact bytes + provenance + Home + visuals + Candidate A + Candidate B + Candidate C + complete journey;
- Release Integration Burn-In is main/manual only and runs two stateful complete journeys, not five copies of the full release matrix;
- heavy Candidate B/C/Stability/Burn-In workflows ignore Markdown-only changes;
- fresh attempt-1 PR/push runs may cancel stale work;
- deliberate reruns and `workflow_dispatch` queue instead of cancelling an already-running proof;
- specialized evidence has one workflow owner instead of being regenerated across unrelated lanes;
- `tests/contracts/ci-orchestration-contracts.cjs` fails if the old duplication/concurrency pattern returns.

Measured result:

- old local Stability browser step: about 6m47s;
- optimized canonical Stability browser step: about 1m11s;
- approximately 82% lower wall time for that job;
- affected normal-PR long-suite command invocations: historically 53 → now 4, greater than 90% lower duplication.

The speed improvement came from removing duplicate ownership, not weakening unique assertions, Candidate C failure scenarios, startup budgets, or the exhaustive public release boundary.

## 8. Release proof 2 after CI optimization

Optimized main Stability run `31651830554` passed canonical local provenance/integration and the exhaustive deployed-site smoke.

Deployed smoke job `94297967413` passed the same eight public boundaries as proof 1: exact bytes, provenance, Home, licensed visuals, Candidate A, Candidate B, Candidate C, and complete public journey.

Focused Release Integration Burn-In run `31651830507` passed 2/2 stateful integration journeys.

Because the CI-only merge changes no runtime files, this is an independent second production proof of the same application runtime `ff755a9863abc843ae9aac45178428e3a104fc65`.

## 9. How to test without recreating the wait loop

For every future developer:

1. choose the workflow that owns the changed behavior;
2. record the run ID once;
3. continue independent work instead of polling every few seconds;
4. inspect after a realistic interval or after a real failure signal;
5. use job logs/annotations to diagnose before rerunning;
6. rerun only the failed/cancelled owner job when possible;
7. never rerun the entire permanent matrix merely to duplicate one proof;
8. for release repetition, repeat canonical deployed Stability proof rather than every specialist lane;
9. if GitHub appears to go backward after rerun, inspect `run_attempt` and `/actions/runs/<run>/attempts/<n>/jobs`;
10. do not modify a frozen runtime while its evidence is being collected;
11. keep documentation-only seals Markdown-only so heavy browser lanes remain skipped.

## 10. Current protected validation structure

There are 14 permanent workflow families and 27 protected executable `.yml` blocks. Normal PRs intentionally exercise 13 families because Release Integration Burn-In is main/manual only.

Static App remains the broad deterministic/release-authority/coherence guard. Candidate B and Candidate C own specialist browser evidence. Stability owns canonical integration and exhaustive deployed smoke. Burn-In owns only repeated stateful integration.

Do not weaken startup limits or unique assertions for speed. The remedy is non-duplicative ownership.

## 11. Documentation authority

`CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md` is detailed development chronology. Its pre-merge status statements are historical. This post-merge file is the current v1.1.5 closure handoff.

A later documentation-only SHA must never redefine `ff755a9863abc843ae9aac45178428e3a104fc65` as the application runtime.

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

`v1.1.5 / 1.1.5-r1 is closed, deployed and twice production-proven. Immutable application runtime is ff755a9863abc843ae9aac45178428e3a104fc65; 0af73262fcc95fbd76ffe9a2f06d4b0dac911f62 is CI/test-only orchestration maintenance and does not redefine runtime. Candidate A/B/C are complete. The two maintenance fixes are immutable confirmed restore intent and transaction-owned rollback with strict exact raw snapshots/preconditions/verification. The old duplicated CI loop caused apparent glitches and has been replaced by single-owner evidence, rerun-safe concurrency, Markdown-only skips, canonical Stability and focused two-pass Burn-In. Cloud remains future-contract-only. Begin v1.2.0 Installable Offline App without reopening v1.1.5.`