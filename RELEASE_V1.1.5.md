# Career Mode Showdown v1.1.5 — Restore Transaction Safety Maintenance

Release tag: `v1.1.5`
Runtime asset revision: `1.1.5-r1`
Status: MERGED / DEPLOYED / TWICE-PROVEN
Immutable runtime merge authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
GitHub Pages build: `1147995655`
Formal production evidence: `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`

## Purpose

v1.1.5 is a focused maintenance release on top of v1.1.4 Candidate C. It changes no competition rules, scoring, manager count, league/club assignment, Transfer Challenge, Season Review calculations, Statistics or accepted football presentation.

The release fixes two major restore-transaction defects, strengthens exact snapshot/precondition/recovery behavior, removes a stale Candidate A provenance fallback, improves CI diagnostics and records future cloud-storage safety contracts without adding a backend or network mutation path.

## Fix 1 — immutable confirmed restore intent

The exact selected File, explicit restore choices and reviewed raw precondition are frozen before the first asynchronous Apply boundary.

Fresh Candidate B analysis consumes that confirmed File. File/review/choice/Apply controls lock while review/apply is in flight. File review is generation-bound so stale asynchronous completion cannot become authority after the selected file changes.

The committed plan therefore cannot silently differ from the plan the user confirmed.

## Fix 2 — transaction-owned rollback

v1.1.5 records mutation ownership only after a write succeeds.

Every planned mutation gets an exact last-moment raw-byte precondition. Failure recovery rolls back only transaction-owned successful mutations, in reverse order. Candidate C refuses to overwrite a newer/unowned third value and verifies owned rollback byte-for-byte.

A failed first write with zero successful mutations performs zero rollback writes and reports `RESTORE NOT STARTED` rather than falsely claiming rollback.

Uncertain ownership/rollback enters locked critical recovery and invalidates uncertain runtime caches.

## Strict exact snapshot authority

Destructive restore uses a strict exact raw snapshot that distinguishes true key absence from a `localStorage.getItem()` failure.

If canonical raw state cannot be read exactly, restore fails closed before mutation.

Candidate C retains two stale-state barriers:

1. reviewed-state comparison after fresh analysis/pending-write flush;
2. transaction-boundary exact preconditions immediately before writes.

Corrupt raw bytes remain preserved unless explicit replacement is selected. Repeated identical restore remains a zero-write no-op.

## Recovery UX

The recovery surface permanently distinguishes:

- `RESTORE NOT STARTED` — no successful canonical mutation occurred;
- `RESTORE ROLLED BACK` — transaction-owned mutations were restored and verified;
- `CRITICAL RECOVERY STATE` — rollback/ownership cannot be proven and restore controls lock.

## Candidate A provenance maintenance

Candidate A backup format remains version 1 and non-mutating.

The obsolete hardcoded v1.1.3 fallback is removed. Provenance uses current `APP_VERSION`, then semantic version derived from shell runtime revision, otherwise `unknown` rather than inventing an old release.

## Future cloud foundation

`CLOUD_STORAGE_FOUNDATION.md` is a future architecture/security contract only.

It defines future account/profile/save/device/installation identity, revision/CAS semantics, explicit conflicts, tombstones, privacy, authenticated ownership and security requirements.

No cloud backend, account requirement or network mutation is included in v1.1.5.

Future remote state must eventually enter the same local exact-snapshot/precondition/verification/transaction-owned rollback boundary.

## Startup/performance protection

Protected ceilings remain unchanged:

- 165,000 raw eager code bytes;
- 37,500 gzip eager code bytes;
- 95,000 startup Marco Reus portrait bytes;
- 260,000 combined first-party startup bytes.

A temporary 31-byte raw overage was fixed without raising the budget.

Normal loading remains 2700 ms and reduced-motion loading remains 220 ms.

## Functional proof before identity freeze

Functional head:

`dbcdffaae927163e5a9c8b44466ff2084e814de5`

passed all 14 permanent workflow families before release identity changed.

## Frozen pre-merge proof

Official candidate:

`97088274e1eac377927476b84c6090e7233e0997`

passed the complete 14-family matrix twice without repository-byte changes.

Required evidence included Candidate C twice-browser recovery, Stability contracts plus two complete Chromium cycles, Burn-In 5/5, Candidate A/B, visual families, complete Static App contracts and the protected 27-block workflow topology.

During the second matrix an older Stability run was re-run while a newer same-ref Stability proof was active. The then-unconditional concurrency cancellation setting cancelled the newer Chromium job. No application assertion failed. Only the cancelled Stability job was retried on the same frozen SHA and passed.

## Merge and production proof

PR #25 merged with expected-head protection against exact candidate SHA `97088274e1eac377927476b84c6090e7233e0997`.

Immutable runtime merge authority:

`ff755a9863abc843ae9aac45178428e3a104fc65`

GitHub Pages build `1147995655` deployed that exact commit at runtime revision `1.1.5-r1`.

Production attempt 1 passed all 14 permanent workflow families.

Production attempt 2 independently passed all 14 families on the same immutable runtime without code changes.

Both production Stability proofs passed:

- exact deployed runtime-byte parity;
- runtime provenance boundary;
- Home/Marco Reus presentation;
- licensed football visuals;
- Candidate A backup export;
- Candidate B read-only analysis;
- Candidate C atomic restore/recovery;
- complete public gameplay/navigation journey.

Candidate C twice-browser recovery and Release Burn-In 5/5 also passed twice in production.

The release is therefore merged, deployed and twice-proven.

## Post-release CI remedy

The Stability interruption was a GitHub Actions scheduling defect, not runtime instability.

Current main uses smart CI orchestration. Stability, Candidate B, Candidate C and Release Burn-In use rerun-safe concurrency: only fresh first-attempt automatic runs may replace stale same-lane work, while reruns/manual dispatches queue. Heavy lanes ignore Markdown-only changes. Local Stability now performs one canonical provenance + complete integration journey per attempt; Candidate B/C each perform one authoritative browser audit per attempt; Burn-In is push/manual only and repeats two focused complete integration journeys rather than five duplicate full matrices.

`tests/contracts/ci-orchestration-contracts.cjs` protects rerun safety, Markdown-only skips, lane ownership, deduplication, bounded timeouts and the full deployed production-smoke boundary.

This is CI-only hardening and does not redefine immutable v1.1.5 runtime authority. Historical v1.1.5 release evidence remains the two-cycle Stability and Burn-In 5/5 proof recorded above.

## Next dependency boundary

v1.1.5 is closed.

v1.2.0 — Installable Offline App — is the next legal substantive milestone.

Cloud implementation, profiles/save registry, QR pairing and two-device work remain dependency-blocked.
