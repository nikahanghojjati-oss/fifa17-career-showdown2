# Career Mode Showdown v1.1.5 — Restore Transaction Safety Maintenance

Release tag: `v1.1.5`
Runtime asset revision: `1.1.5-r1`
Status: RELEASED — DEPLOYED AND INDEPENDENTLY PRODUCTION-PROVEN TWICE
Owner acceptance: technical release proof complete

## Purpose

v1.1.5 is a focused maintenance release on top of v1.1.4 Candidate C. It changes no competition rule, scoring rule, manager count, league/club assignment rule, Transfer Challenge behavior, Season Review calculation, Statistics formula, backup format version, storage key, accepted football-photo source, or protected Marco Reus presentation.

It fixes two major restore-transaction defects, strengthens strict snapshot/precondition/recovery semantics, removes a stale Candidate A provenance fallback, defines future cloud-storage safety requirements without adding cloud runtime, and permanently improves CI diagnostics/orchestration.

## Major bug fix 1 — confirmed restore intent is immutable across asynchronous revalidation

v1.1.4 correctly revalidated a selected backup before writing, but the confirmed decision object/file state remained mutable while asynchronous verification was running. A user could confirm visible plan A, alter controls during fresh analysis, and allow plan B to reach commit without the same confirmation.

v1.1.5 closes that race:

1. the exact selected `File`, restore choices, and reviewed raw precondition are copied before the first asynchronous boundary;
2. fresh Candidate B analysis runs against that exact confirmed file;
3. file picker, Review, all restore selects/conflict controls, and Apply are locked while review/apply is in flight;
4. review completion is generation-bound to the file that started it;
5. Apply passes only immutable confirmed values into planner/orchestrator;
6. deterministic contracts mutate caller-side choices after Apply begins and require original confirmed intent to win;
7. real Chromium maintenance coverage delays fresh analysis, attempts a choice mutation while Apply is in flight, and requires the confirmed state to commit.

## Major bug fix 2 — rollback is limited to transaction-owned mutations

v1.1.4 built an affected-key list before commit and rolled the whole list back after failure. Keys whose write never succeeded or was never reached were still rewritten. A first-key failure could therefore perform unnecessary rollback writes, falsely escalate to critical recovery, and potentially overwrite newer cross-context bytes the transaction never owned.

v1.1.5 introduces mutation ownership:

1. every commit write receives an exact last-moment `prewrite` raw-byte check;
2. the full planning snapshot can be supplied as initial transaction precondition;
3. `committedKeys` is recorded only after a commit write succeeds;
4. rollback scope is exactly successful transaction-owned keys, in reverse commit order;
5. a failed first write owns zero mutations, returns `write-failed-clean`, performs zero rollback writes, and leaves original bytes authoritative;
6. before rollback, current bytes must still equal either original snapshot or this transaction's candidate value;
7. if a third/newer value exists, Candidate C refuses to clobber it and records an ownership conflict;
8. rollback verification is byte-for-byte and limited to transaction-owned mutations;
9. unverified ownership/rollback enters critical recovery and invalidates runtime caches instead of presenting uncertain state as authoritative.

## Strict exact snapshot and stale-state hardening

The destructive path uses strict exact raw snapshots that distinguish true absence from `localStorage.getItem()` failure. If any canonical key cannot be read exactly, Apply fails closed before mutation.

Candidate C has two stale-state barriers:

1. reviewed-state comparison after fresh Candidate B analysis and pending-write flush;
2. last-moment per-write byte preconditions immediately before mutation.

Complete final values are computed in memory before mutation. All canonical writes remain under `js/storage.js` authority. Every committed value is verified. Transaction-owned rollback is verified byte-for-byte.

Corrupt raw bytes remain opaque preservation data until explicit replacement. Repeated application of an already-restored backup remains a deterministic zero-write no-op.

## Recovery UX distinctions

The recovery surface distinguishes materially different outcomes:

- `RESTORE NOT STARTED`: first required write failed before any canonical mutation; rollback was unnecessary;
- `RESTORE ROLLED BACK`: transaction-owned mutations occurred and were restored/verified byte-for-byte;
- `CRITICAL RECOVERY STATE`: rollback or ownership could not be proven. Candidate C controls lock until refresh and uncertain runtime caches are invalidated.

Existing explicit conflict choices, stale-state review, corrupt-data guidance, deterministic re-import, double-activation protection, lifecycle protection, mobile/footer accessibility, and 44 px file input floor remain protected.

## Candidate A provenance maintenance

Candidate A backup format remains version 1 and non-mutating. The old isolated fallback that stamped historical `1.1.3` when global `APP_VERSION` was unavailable was removed.

Provenance now uses:

1. current global `APP_VERSION` when available;
2. semantic version parsed from shell runtime revision when global authority is unavailable;
3. explicit `unknown` if neither exists.

A historical release is never invented as current provenance.

## Future cloud-storage foundation

`CLOUD_STORAGE_FOUNDATION.md` is future architecture/threat-model contract only. v1.1.5 adds no backend, account requirement, network write, or second persistence authority.

The future contract defines:

- distinct account/profile/save/device/installation/object identities;
- server-authoritative revisions with `baseRevision`/parent semantics and compare-and-swap writes;
- content hashes as integrity evidence, never authentication;
- explicit divergent-head conflicts instead of silent last-write-wins gameplay state;
- tombstones with deletion revisions and anti-resurrection behavior;
- local-first/opt-in cloud privacy, minimization, export/delete, and retention requirements;
- authenticated ownership, server-side authorization, TLS, least privilege, secure session/token handling, replay/idempotency protection, and rate/schema/size limits;
- no admin/service credential in static JavaScript;
- no future cloud module calling localStorage directly;
- remote/conflict-resolved data still passing Candidate C-style exact local preconditions, in-memory computation, canonical storage authority, verification, and transaction-owned rollback.

Cloud remains dependency-blocked. v1.2.0 Installable Offline App is next; stable local profiles/save identity follow in v1.3 before cloud readiness.

## Protected startup boundary

Historical ceilings remain unchanged:

- 165,000 raw eager code bytes;
- 37,500 gzip eager code bytes;
- 95,000 bytes for startup Marco Reus portrait;
- 260,000 combined first-party startup bytes.

During maintenance, strict storage hardening briefly measured 165,031 raw / 37,409 gzip and correctly failed the 165,000 raw ceiling by 31 bytes. The limit was not raised. An obsolete eager comment was removed to recover the bytes without changing runtime behavior. Normal loading remains 2700 ms and reduced-motion loading remains 220 ms.

## Functional maintenance proof before identity freeze

Functional head `dbcdffaae927163e5a9c8b44466ff2084e814de5` passed all 14 then-current permanent workflow families before release-number migration. This isolated the two runtime fixes from later version/document work.

The frozen v1.1.5 release-candidate head `97088274e1eac377927476b84c6090e7233e0997` also passed the release matrix. Candidate C browser evidence included both the original deep recovery scenarios and the new immutable-confirmed-intent/clean-first-write scenarios.

## Production release evidence

Immutable application runtime SHA: `ff755a9863abc843ae9aac45178428e3a104fc65`
GitHub Pages deployment: `5878930362`
Runtime revision: `1.1.5-r1`

### Production proof 1

Stability run `31650134707`, attempt 1, completed successfully. Deployed-site-smoke job `94293855547` passed:

1. exact Pages runtime-byte parity;
2. runtime error provenance;
3. Home/Marco Reus visual audit;
4. licensed crop-safe football-photo audit;
5. Candidate A backup export;
6. Candidate B read-only import analysis;
7. Candidate C destructive restore/recovery;
8. complete public gameplay/navigation journey.

A later rerun reset GitHub's visible current attempt but did not invalidate attempt-1 evidence.

### Post-merge CI orchestration maintenance

Investigation of repeated waiting/cancellation found orchestration churn rather than application instability:

- local Stability serialized seven browser suites twice;
- Candidate B and Candidate C each duplicated their already multi-scenario specialist suites;
- Burn-In repeated nearly the complete release matrix five times;
- documentation-only work could relaunch heavy browser lanes;
- deliberate reruns could cancel active Stability work because concurrency did not distinguish rerun attempts.

CI-only PR #26 was validated at `36b3157073c999933e45482016e4427c165700ac` and merged as `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62`. No application/runtime/assets/data file changed.

The protected model now uses single-owner evidence:

- Candidate B once per workflow attempt;
- Candidate C once per workflow attempt;
- local Stability once for runtime provenance + complete integration journey;
- deployed Stability remains exhaustive across exact bytes, Home/visuals, Candidate A/B/C, and full journey;
- Release Integration Burn-In is main/manual only and repeats two complete stateful journeys;
- heavy Candidate B/C/Stability/Burn-In ignore Markdown-only changes;
- fresh attempt-1 PR/push work may cancel stale work, but deliberate reruns/manual dispatch queue;
- permanent `ci-orchestration-contracts.cjs` rejects regression to the old duplicate model.

Measured local Stability browser wall time improved from about 6m47s to about 1m11s. The protected orchestration model records 53 historical duplicated long-suite command invocations versus 4 on a normal PR across the affected lanes.

### Production proof 2

Optimized Stability run `31651830554` passed canonical local provenance/integration and the exhaustive public Pages smoke. Deployed-site-smoke job `94297967413` passed the same eight public boundaries as proof 1.

Focused Release Integration Burn-In run `31651830507` passed 2/2 stateful integration journeys.

Because `ff755a9863abc843ae9aac45178428e3a104fc65` → `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62` contains no application runtime change, this is an independent second production proof of the same v1.1.5 runtime.

## Testing operation rule

Do not recreate the release-loop behavior:

- choose the workflow that owns the changed behavior;
- record a run ID once and continue other work;
- do not poll long jobs every few seconds;
- diagnose from job conclusion/logs before rerunning;
- rerun only a failed/cancelled owner job when possible;
- do not rerun all permanent workflows merely to duplicate one proof;
- inspect `run_attempt` and attempt history when the UI appears to restart;
- keep documentation-only seals Markdown-only so heavy browser workflows remain skipped.

## Next dependency boundary

v1.2.0 Installable Offline App is now the next legal substantive build.

Cloud implementation, profiles/save registry, QR pairing, and two-device work remain dependency-blocked. v1.2 must preserve v1.1.5 runtime-revision integrity and local data-safety across service-worker install/update/rollback/cache-corruption behavior.