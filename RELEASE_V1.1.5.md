# Career Mode Showdown v1.1.5 — Restore Transaction Safety Maintenance

Release tag: `v1.1.5`
Runtime asset revision: `1.1.5-r1`
Status: PRE-MERGE RELEASE CANDIDATE
Owner acceptance: pending final deployed build proof

## Purpose

v1.1.5 is a focused maintenance release on top of the twice-proven v1.1.4 Candidate C release. It does not change competition rules, scoring, manager count, league/club assignment, Transfer Challenge, Season Review calculations, Statistics, licensed football-photo source authority or the protected Marco Reus loading presentation.

The release fixes two major restore-transaction defects discovered by a deeper maintenance audit, strengthens exact snapshot/precondition/recovery behavior, removes stale Candidate A provenance fallback, makes contract failures easier to diagnose, and records a future cloud-storage safety contract without adding a cloud backend or network mutation path.

## Major bug fix 1 — confirmed restore intent is immutable across asynchronous revalidation

v1.1.4 correctly revalidated the selected backup before writing, but the confirmed decision object remained mutable while that asynchronous verification was running. The Apply button was disabled, but file/choice controls could still change. A user could confirm one visible restore plan and change a choice during fresh analysis, allowing a different plan to reach commit without receiving the same confirmation.

v1.1.5 closes that race:

1. the exact selected `File`, restore choices and reviewed raw precondition are copied before the first asynchronous boundary;
2. fresh Candidate B analysis runs against that exact confirmed file;
3. the file picker, Review control, all restore selects/conflict controls and Apply are locked while review/apply is in flight;
4. review completion is generation-bound to the exact file that started it, so a stale analysis result cannot become authority after file selection changes;
5. Apply passes only immutable confirmed values into the planner/orchestrator;
6. deterministic contracts deliberately mutate the caller-side choice object after Apply begins and require the original confirmed plan to win;
7. a real Chromium maintenance audit delays fresh analysis, attempts a programmatic choice mutation while Apply is in flight and requires the originally confirmed backup state to commit.

This strengthens fresh revalidation without weakening explicit user consent.

## Major bug fix 2 — rollback is limited to transaction-owned mutations

v1.1.4 built the affected-key list before commit and rolled that whole list back after a failure. That was conservative but incorrect for a partial commit: keys whose write never succeeded or was never reached were still rewritten during rollback. A first-key failure could therefore trigger unnecessary writes and even false critical recovery. More importantly, a rollback could overwrite newer cross-context bytes for a key this transaction never actually changed.

v1.1.5 introduces mutation ownership:

1. every commit write receives an exact last-moment `prewrite` raw-byte check;
2. the full planning snapshot can be supplied as an initial transaction precondition;
3. `committedKeys` is recorded only after a commit write succeeds;
4. rollback scope is exactly the successful mutation-owned keys, in reverse commit order;
5. a failed first write owns zero mutations, returns `write-failed-clean`, performs zero rollback writes and leaves original canonical bytes authoritative;
6. before rolling back an owned key, current bytes must still equal either the original snapshot or this transaction's candidate value;
7. if a third/newer value exists, Candidate C refuses to clobber it and records a rollback ownership conflict;
8. rollback verification is limited to transaction-owned mutations and remains byte-for-byte;
9. unverified rollback/ownership loss enters critical recovery and invalidates runtime caches rather than presenting uncertain in-memory state as authoritative.

This local ownership model is also a prerequisite for future revision-safe cloud synchronization.

## Exact snapshot and stale-state hardening

The destructive restore path now uses `captureCareerModeRawRestoreSnapshot()` as a strict snapshot authority. It differentiates true key absence from a `localStorage.getItem()` failure. If any canonical raw key cannot be read exactly, Apply returns `snapshot-unavailable` and performs no write.

Candidate C now has two stale-state barriers:

1. reviewed-state comparison after fresh Candidate B analysis and pending-write flush;
2. last-moment per-write transaction preconditions immediately before mutation.

Transaction-boundary drift is normalized back into explicit stale-state recovery instead of being treated as an ordinary storage failure.

Corrupt raw bytes remain opaque preservation data until the user explicitly selects replacement. Repeated application of an already-restored backup remains a zero-write no-op.

## Recovery UX distinctions

The recovery surface now distinguishes three materially different outcomes:

- `RESTORE NOT STARTED`: the first required write failed before Candidate C changed any canonical key; rollback was unnecessary;
- `RESTORE ROLLED BACK`: one or more transaction-owned mutations occurred and were restored/verified byte-for-byte;
- `CRITICAL RECOVERY STATE`: rollback or mutation ownership could not be proven. Candidate C controls lock until refresh and the runtime cache is invalidated.

The existing successful restore, stale-state review, explicit conflict choices, corrupt-data guidance, deterministic repeat import, double-activation lock, lifecycle protection, mobile/footer accessibility and 44 px file input floor remain protected.

## Candidate A provenance maintenance

Candidate A backup format remains format version 1 and remains non-mutating. The old isolated fallback that stamped `1.1.3` when global `APP_VERSION` was unavailable has been removed.

Provenance now uses:

1. current global `APP_VERSION` when available;
2. semantic version parsed from the shell runtime revision when the global is unavailable;
3. explicit `unknown` if neither authority exists.

A historical release is never invented as current provenance.

## Future cloud-storage foundation

`CLOUD_STORAGE_FOUNDATION.md` is introduced as a future architecture/threat-model contract only. v1.1.5 does not add a backend, account requirement, network write or second persistence authority.

The future contract defines:

- distinct account/profile/save/device/installation/object identities;
- server-authoritative revisions with `baseRevision`/parent semantics and compare-and-swap writes;
- content hashes as integrity evidence, never authentication;
- explicit divergent-head conflicts instead of silent last-write-wins gameplay state;
- tombstones with deletion revisions and anti-resurrection behavior;
- local-first/opt-in cloud privacy, data minimization, export/delete and retention requirements;
- authenticated ownership, server-side authorization, TLS, least privilege, secure session/token handling, replay/idempotency protection, rate limits and input/schema limits;
- a rule that future downloaded/conflict-resolved data must still pass Candidate C-style exact local preconditions, in-memory computation, canonical storage authority, verification and ownership-scoped rollback.

Cloud remains dependency-blocked by the approved roadmap. After this maintenance release the next legal substantive milestone remains v1.2.0 Installable Offline App; stable local profiles/save identity precede Cloud Readiness and Cloud Backup Beta.

## Gate/tooling hardening

v1.1.5 adds permanent regression coverage rather than one-time diagnostics:

- `restore-maintenance-contracts.cjs` protects immutable confirmed intent, strict snapshot failure and transaction-boundary stale handling;
- `restore-maintenance-audit.cjs` adds real-browser confirmed-intent race and clean first-write-failure scenarios;
- `cloud-foundation-contracts.cjs` protects the future cloud dependency/security contract;
- `run-restore-contracts.cjs` and `run-contract-suite.cjs` emit exact failing contract filenames/assertions as GitHub annotations;
- Final Polish emits exact startup raw/gzip measurements before enforcing the existing limits.

The permanent Candidate C browser command now runs the original deep recovery audit plus the new maintenance audit, so the dedicated Candidate C lane, Stability and every Burn-In pass inherit the new scenarios.

## Protected startup boundary

The historical ceilings remain unchanged:

- 165,000 raw eager code bytes;
- 37,500 gzip eager code bytes;
- 95,000 bytes for the startup Marco Reus portrait;
- 260,000 combined first-party startup bytes.

The first functional maintenance matrix measured 165,031 raw / 37,409 gzip after strict storage hardening and correctly failed the 165,000 raw ceiling by 31 bytes. The ceiling was not raised. An obsolete eager comment referencing the superseded 1900 ms loading minimum was removed, recovering the required bytes without changing runtime behavior. Normal loading remains 2700 ms and reduced-motion loading remains 220 ms.

## Functional maintenance proof before release identity freeze

Before changing the release number, functional head `dbcdffaae927163e5a9c8b44466ff2084e814de5` passed all 14 permanent workflow families:

- all ordinary workstream families green;
- dedicated Candidate C contracts green;
- Candidate C complete destructive/recovery browser command green twice, including the new maintenance scenarios;
- Stability contracts green and both complete Chromium cycles green;
- Candidate C Release Burn-In green 5/5;
- Candidate A/B and licensed visual families green;
- Static App complete repository contract suite and protected 27-block workflow topology green;
- protected startup budgets green with original thresholds.

This proves the two bug fixes independently of the subsequent version/document identity migration.

## Formal release evidence still required

The release must not be called deployed/proven until all of the following complete on one coherent `v1.1.5` / `1.1.5-r1` candidate:

1. package, lockfile, source, shell/cache and current authority documents agree on v1.1.5;
2. one exact PR #25 head SHA is frozen;
3. all 14 permanent workflow families pass on that exact SHA;
4. a second independent same-SHA permanent-family matrix passes;
5. PR #25 merges with expected-head protection;
6. GitHub Pages serves exact `1.1.5-r1` runtime bytes from the immutable merge SHA;
7. production Stability passes exact bytes, provenance, Home/Reus, licensed visuals, Candidate A, Candidate B, Candidate C and the full public journey;
8. production Burn-In passes 5/5;
9. all production families are independently repeated on the same immutable runtime SHA;
10. current authority/handoff documents are sealed after proof without redefining the immutable runtime authority.

Until those steps complete, this file is a release-candidate record.

## Next dependency boundary

After v1.1.5 is deployed and twice-proven, v1.2.0 Installable Offline App is the next legal substantive build. Cloud implementation, profiles/save registry, QR pairing and two-device work remain dependency-blocked.