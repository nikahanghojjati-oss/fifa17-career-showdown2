# Career Mode Showdown v1.1.5 — Post-Merge Production Seal

Date: 2026-08-12
Status: MERGED / DEPLOYED / TWICE-PROVEN
Application version: v1.1.5
Runtime asset revision: `1.1.5-r1`
Immutable runtime merge authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
GitHub Pages build: `1147995655`

## 1. Purpose of this record

This is the immutable evidence record for the v1.1.5 Restore Transaction Safety Maintenance release.

The release is complete. Candidate A, Candidate B and Candidate C must not be reopened merely because older planning or pre-merge documents describe them as current work.

The next legal substantive milestone is v1.2.0 — Installable Offline App.

Future cloud identity/revision/conflict/tombstone/privacy/security work remains architecture-contract-only until its later roadmap dependency is reached.

## 2. Release lineage and immutable identities

Functional maintenance proof before the release-number freeze:

`dbcdffaae927163e5a9c8b44466ff2084e814de5`

That head passed all 14 permanent workflow families before v1.1.5 identity/document migration.

Frozen official pre-merge candidate:

`97088274e1eac377927476b84c6090e7233e0997`

PR #25 merged only with expected-head protection against that exact SHA.

Immutable v1.1.5 runtime merge authority:

`ff755a9863abc843ae9aac45178428e3a104fc65`

The merge commit has the same runtime tree as the frozen candidate. Later documentation/CI-only commits do not redefine this immutable application runtime authority when `index.html`, runtime JavaScript, CSS, data, assets and package/runtime identity remain unchanged.

## 3. Maintenance behavior sealed by v1.1.5

v1.1.5 fixed two major Candidate C defects without changing gameplay or backup format version 1.

### Immutable confirmed restore intent

Restore now freezes the exact selected File, explicit choices and reviewed raw-state precondition before the first asynchronous Apply boundary. Fresh Candidate B revalidation consumes those frozen values. Review/file/choice/Apply controls are locked while review/apply is in flight, and stale asynchronous file-review completion cannot become authority.

### Transaction-owned rollback

Candidate C now records mutation ownership only after a write succeeds. Failure recovery rolls back only transaction-owned committed keys, in reverse commit order. Exact initial and per-write raw-byte preconditions detect drift. Candidate C refuses to overwrite a third/newer value it cannot prove it owns. Rollback is verified byte-for-byte.

A failed first write with zero successful mutation is `RESTORE NOT STARTED` and performs zero rollback writes. Verified owned rollback is distinct from locked critical recovery.

Strict destructive snapshots distinguish true key absence from storage read failure and fail closed before mutation.

## 4. Pre-merge release proof

### Matrix 1

Frozen SHA `97088274e1eac377927476b84c6090e7233e0997` passed all 14 permanent workflow families.

Required heavy proof included:

- Candidate C deterministic contracts;
- Candidate C twice-browser destructive/recovery audit;
- Stability contracts plus two complete Chromium cycles;
- Candidate C Release Burn-In 5/5;
- Candidate A and Candidate B;
- Home/Reus and licensed football visuals;
- Static App complete repository contracts;
- permanent 27-block workflow topology;
- unchanged startup budgets.

### Matrix 2

The same frozen SHA independently passed all 14 families a second time without any repository-byte change.

During this second proof an older Stability run was manually re-run while a newer Stability proof was already active. The workflow then used unconditional `cancel-in-progress: true` for the same PR-ref concurrency group. The old re-run therefore cancelled the newer Chromium Stability job mid-execution.

This was a GitHub Actions scheduling cancellation, not a Stability assertion failure. No gameplay, restore, browser, provenance or deployment assertion failed.

Only the cancelled Stability job was re-run on the exact same frozen SHA. Stability contracts and both complete Chromium cycles then passed. The rest of the already-green matrix was not restarted.

That incident is the reason the post-release CI concurrency hardening described below exists.

## 5. Expected-head merge

PR #25 was marked ready only after both pre-merge matrices were green.

The merge used expected-head protection against:

`97088274e1eac377927476b84c6090e7233e0997`

Resulting immutable runtime merge SHA:

`ff755a9863abc843ae9aac45178428e3a104fc65`

No later branch movement could enter that merge unnoticed.

## 6. GitHub Pages deployment

GitHub Pages build:

`1147995655`

The Pages build completed successfully from exact commit:

`ff755a9863abc843ae9aac45178428e3a104fc65`

The deployed runtime revision is `1.1.5-r1`.

## 7. Production proof — attempt 1

Production attempt 1 passed all 14 permanent workflow families on immutable runtime SHA `ff755a9863abc843ae9aac45178428e3a104fc65`.

Heavy production evidence:

- Candidate C workflow run `31650134925`, attempt 1: contracts green and twice-browser restore/recovery green;
- Candidate C Release Burn-In run `31650134648`, attempt 1: 5/5 green;
- Stability run `31650134707`, attempt 1: contracts green, two complete Chromium cycles green, deployed-site smoke green.

The deployed-site Stability smoke proved:

1. exact public runtime-byte parity to immutable merge authority;
2. runtime error provenance boundary;
3. Home/Marco Reus presentation;
4. licensed crop-safe football visuals;
5. Candidate A backup export;
6. Candidate B read-only import analysis;
7. Candidate C atomic restore/recovery;
8. complete public gameplay/navigation journey.

## 8. Production proof — attempt 2

Without changing any repository byte, the same immutable runtime received a second independent production proof.

Ordinary workflow families were re-run from their completed attempt-1 jobs rather than launching an overlapping blanket matrix.

Required heavy proof:

- Candidate C workflow run `31650134925`, attempt 2: deterministic contracts green, both restore/recovery browser passes green, evidence upload green;
- Candidate C Release Burn-In run `31650134648`, attempt 2: all five release-gate jobs green;
- Stability run `31650134707`, attempt 2: Stability contracts green, both complete Chromium cycles green, deployed-site smoke green.

The second deployed-site smoke again passed exact public byte parity, runtime provenance, Home/Reus, licensed football visuals, Candidate A, Candidate B, Candidate C and the complete public journey.

Therefore v1.1.5 is production twice-proven.

A later redundant Burn-In re-run attempt was triggered by earlier per-job re-run requests being coalesced by GitHub. It is post-proof noise, not part of the release authority. Burn-In has `cancel-in-progress: false`, so it could not cancel or invalidate the completed proof.

## 9. Stability cancellation root cause and permanent remedy

The apparent repeated Stability “glitch” was not application instability.

Root cause:

- long proof workflows used a same-ref concurrency group;
- Stability, Candidate B and Candidate C allowed unconditional `cancel-in-progress: true`;
- GitHub re-runs retain the same workflow/ref concurrency identity;
- re-running an older completed Stability run while a newer proof was active therefore gave the re-run authority to cancel the newer proof.

Permanent post-release policy on current main uses rerun-safe, deduplicated orchestration:

`cancel-in-progress: ${{ github.run_attempt == 1 && github.event_name != 'workflow_dispatch' }}`

Stability, Candidate B, Candidate C and Release Burn-In all use this rerun-safe principle with lane/ref concurrency groups.

Effect:

- a fresh automatic first-attempt run may replace genuinely stale same-lane work;
- a GitHub rerun cannot cancel an already-active proof;
- a manual `workflow_dispatch` cannot cancel an already-active proof;
- Markdown-only changes skip the heavy proof lanes;
- local Stability executes one canonical provenance + complete integration journey per attempt instead of hiding a second full matrix;
- Candidate B and Candidate C each execute one authoritative browser audit per attempt;
- Release Burn-In is push/manual only and repeats two focused complete integration journeys rather than five duplicate full matrices;
- deliberate independent repetition is expressed by GitHub rerun attempts, keeping evidence identities explicit.

`tests/contracts/ci-orchestration-contracts.cjs` permanently protects rerun safety, Markdown-only skips, deduplication, lane ownership, bounded timeouts and the full deployed production-smoke boundary.

The v1.1.5 release itself was still proved under the historical two-cycle Stability and Burn-In 5/5 protocol; that evidence is immutable release history.

## 10. Runtime remains unchanged by the CI/documentation seal

The post-release seal is allowed to change only documentation, contract tests and existing workflow scheduling policy.

It must not modify the immutable v1.1.5 runtime tree:

- `index.html`;
- `js/` application runtime;
- `css/` runtime presentation;
- `data/` runtime data;
- `assets/`;
- package/runtime version identity.

The immutable application runtime authority therefore remains:

`ff755a9863abc843ae9aac45178428e3a104fc65`

A later documentation/CI merge SHA is repository history, not a new v1.1.5 application runtime, when those runtime bytes are unchanged.

## 11. Next legal work

v1.1.5 is closed.

The next legal substantive milestone is:

v1.2.0 — Installable Offline App.

The v1.2 design must preserve current local data-safety guarantees while introducing service-worker/install/update behavior. It must not jump directly to accounts, cloud backup, profiles/save registry, QR pairing or two-device synchronization.

Read `POST_V1_ROADMAP_EXECUTION.md` before implementing v1.2.
