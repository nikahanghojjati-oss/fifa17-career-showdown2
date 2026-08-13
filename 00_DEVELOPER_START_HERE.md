# Career Mode Showdown — Developer Start Here

Last updated: 2026-08-12
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Purpose: canonical current-facing first read for a new developer session.

## 0. Sixty-second state

Application version: `v1.1.5`
Runtime asset revision: `1.1.5-r1`
Public status: deployed, protected, and independently production-proven twice
Immutable application runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
Proven runtime Pages deployment: `5878930362`

Do not hardcode a mutable `main` SHA into current authority. Repository `main` may advance through CI/test/documentation-only commits without redefining the application runtime. Read GitHub when the current repository head is needed.

The CI-orchestration merge `0af73262fcc95fbd76ffe9a2f06d4b0dac911f62` is an immutable historical checkpoint showing the optimized test architecture. A later documentation-only Pages deployment is also expected and does not redefine runtime authority.

Candidate A export, Candidate B read-only import analysis, and Candidate C Atomic Restore + Recovery are complete and protected. v1.1.5 fixes immutable confirmed restore intent and transaction-owned rollback while preserving strict exact raw snapshots, stale-state detection, deterministic zero-write re-import, corrupt-byte preservation, storage authority, post-write verification, and byte-for-byte rollback verification for transaction-owned mutations.

`CLOUD_STORAGE_FOUNDATION.md` is future architecture/security contract only. It defines identity, revisions, compare-and-swap conflicts, tombstones, privacy, and security requirements. It does not authorize a cloud backend or network mutation.

Next legal substantive milestone: v1.2.0 — Installable Offline App.

## 1. Read order

1. `00_HANDOFF_GOLDEN_RULE.md`.
2. This file.
3. `NEXT_TASK.md`.
4. `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`.
5. `PROJECT_STATE.md`.
6. `RELEASE_V1.1.5.md`.
7. `POST_V1_ROADMAP_EXECUTION.md` before implementing v1.2.
8. `CLOUD_STORAGE_FOUNDATION.md` only when future sync/security design is relevant.
9. `CAREER_MODE_SHOWDOWN_V1.1.5_MAINTENANCE_HANDOFF.md` only for detailed maintenance chronology and defect archaeology.

Current source on `main` wins over stale historical status prose. Never revert proven code merely to satisfy an older document; correct the document.

## 2. Locked product model

Career Mode Showdown is a two-manager FIFA 17 Career Mode rivalry companion, not a browser football simulator and not yet a cloud/account product.

Locked rules include:

- exactly two managers;
- one local browser/device and one active Showdown;
- both managers play their own FIFA 17 Career Mode saves outside the site;
- manual FIFA 17 result entry is authoritative;
- same selected league, different permanent clubs;
- Showdown lengths `[1,3,5,10]`;
- default leagues Premier League, LaLiga, Bundesliga, Serie A, Ligue 1;
- Champions League +5, League +3, main domestic Cup +1;
- 100 points and/or 100 goals share maximum +1;
- Top Scorer and/or Top Assist share maximum +1;
- maximum Season score 11;
- equal non-zero scores are Draw;
- only 0–0 uses league position then league points.

Do not change these rules during v1.2 PWA work.

## 3. Architecture authority

Navigation/history: `js/screens.js`.
Persistence/destructive mutation: `js/storage.js`.
Raw atomic transaction engine: `js/storageTransaction.js` behind storage authority.
Scoring: `js/scoring.js`.
Canonical Showdown model: `js/showdown.js`.
Analytics: `js/analytics.js`.

Canonical localStorage keys remain exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema: 2.
Current preferences schema: 2.

## 4. Candidate A/B/C safety contract

Candidate A is non-mutating export. SHA-256 is integrity evidence only, never encryption, signing, authentication, or authorization.

Candidate B is strictly read-only analysis. Preview is evidence, never write authority.

Candidate C is the only import stage allowed to commit canonical state. A legal Apply must preserve this sequence:

1. flush pending canonical writes;
2. freeze the exact confirmed File, choices, and reviewed raw precondition before asynchronous work;
3. freshly revalidate that exact file;
4. capture a strict exact raw snapshot distinguishing absence from read failure;
5. reject stale reviewed state;
6. compute the complete final candidate in memory;
7. require explicit active/Legacy/preferences/conflict choices;
8. enter `js/storage.js` with exact planning bytes as transaction precondition;
9. recheck exact bytes immediately before each mutation;
10. write deterministic active → Legacy → preferences order;
11. grant mutation ownership only after a successful write;
12. verify every committed byte/value;
13. on failure roll back only transaction-owned mutations in reverse order;
14. refuse to clobber third/newer unowned bytes;
15. verify owned rollback byte-for-byte;
16. lock critical recovery and invalidate uncertain caches if ownership/rollback cannot be proven;
17. synchronize runtime/navigation only after complete verified success;
18. keep repeated identical restore a zero-write no-op;
19. preserve corrupt raw bytes unless explicit replacement is chosen;
20. keep all canonical mutation under `js/storage.js` authority.

Recovery states are intentionally distinct: `RESTORE NOT STARTED`, `RESTORE ROLLED BACK`, and `CRITICAL RECOVERY STATE`.

## 5. Immutable v1.1.5 release evidence

Runtime SHA: `ff755a9863abc843ae9aac45178428e3a104fc65`.
Proven runtime Pages deployment: `5878930362`.

Production proof 1:

- Stability run `31650134707`, attempt 1;
- deployed-site-smoke job `94293855547`;
- exact runtime bytes, provenance, Home/Reus, licensed visuals, Candidate A, Candidate B, Candidate C, and complete public journey all green.

Production proof 2 after CI-only orchestration maintenance:

- Stability run `31651830554`;
- deployed-site-smoke job `94297967413`;
- the same exhaustive public boundary green again;
- focused Release Integration Burn-In run `31651830507` passed 2/2.

The second proof remains evidence for the same application runtime because the CI-only orchestration changes do not modify application/runtime/assets/data bytes.

## 6. Smart CI rule — do not recreate the testing loop

The old repeated waiting/backtracking was orchestration churn, not application instability.

Permanent rules:

- specialized workflows own specialized evidence once per workflow attempt;
- Candidate B owns one authoritative import-analysis browser run;
- Candidate C owns one authoritative restore/recovery browser run;
- local Stability owns one runtime-provenance audit plus one complete integration journey;
- deployed Stability remains exhaustive: exact bytes + provenance + Home + visuals + Candidate A + Candidate B + Candidate C + full journey;
- Burn-In is main/manual only and repeats the complete integration journey twice, not five full release matrices;
- heavy Candidate B/C/Stability/Burn-In workflows ignore Markdown-only changes;
- fresh attempt-1 PR/push runs may cancel stale work;
- reruns/manual dispatches queue instead of cancelling active proofs;
- do not rerun all permanent workflows merely to repeat one public proof;
- if an independent live proof is needed, repeat the canonical deployed Stability proof rather than every unrelated family;
- never infer failure because GitHub UI resets after a rerun; inspect `run_attempt` and job conclusion;
- do not poll long jobs every few seconds. Record the run ID, continue independent work, and inspect after realistic wall time or a real failure signal.

Measured improvement: old local Stability browser work took about 6m47s; optimized canonical Stability took about 1m11s. `tests/contracts/ci-orchestration-contracts.cjs` prevents regression to the duplicated model.

## 7. Performance and presentation locks

Eager raw code ceiling: 165,000 bytes.
Eager gzip ceiling: 37,500 bytes.
Startup Marco Reus portrait ceiling: 95,000 bytes.
Combined first-party startup ceiling: 260,000 bytes.
Normal loading minimum: 2700 ms.
Reduced-motion loading: 220 ms.

Protected Marco Reus Home/loading presentation and accepted licensed route-photo sources remain unchanged.

## 8. Future cloud boundary

Cloud remains future-only. Before any implementation preserve:

- distinct `accountId`, `profileId`, `saveId`, `deviceId`, `installationId`, and object identity;
- server-authoritative revision tokens and `baseRevision`/parent semantics;
- compare-and-swap mutation and explicit conflicts;
- tombstones/deletion revisions and anti-resurrection;
- local-first opt-in privacy, minimization, export/delete, and retention;
- TLS, authentication, server-side authorization, least privilege, secure tokens, replay/idempotency protection, and rate/schema/size limits;
- no privileged secret in static client JS;
- no future cloud module calling localStorage directly;
- all downloaded/conflict-resolved state passing the same local exact-snapshot/precondition/verification/transaction-owned rollback boundary.

## 9. Next milestone

v1.2.0 — Installable Offline App.

Start with manifest/service-worker/update/cache recovery design. The service worker must never mix incompatible runtime revisions or make local recovery less reliable. Stable local profiles/save identity are v1.3; cloud readiness comes later.

A correctly oriented developer should be able to state:

`v1.1.5 / 1.1.5-r1 is deployed and twice production-proven. Immutable application runtime is ff755a9863abc843ae9aac45178428e3a104fc65. Mutable main/docs SHAs are not runtime authority and must be read from Git rather than hardcoded into current docs. Candidate A/B/C are complete. v1.1.5 fixes immutable confirmed restore intent and transaction-owned rollback. The duplicated testing loop is retired. Cloud is future-contract-only. The next substantive milestone is v1.2.0 Installable Offline App.`