# CURRENT OVERRIDE — Stage 4 Connected Rivalry Source Seal — 2026-08-21 ET

Current source, live GitHub state, provider state and later owner instructions override this record.

Production remains `v1.6.0 / 1.6.0-r1`, with Stage 3 Registered Devices / Private Pairing production-proven. Stage 4 is a `v1.7.0 / 1.7.0-r1` RELEASE CANDIDATE and is NOT production-proven.

PR #130 `v1.7.0 Stage 4: Connected Rivalry` is on branch `agent/v1.7.0-connected-rivalry-state`, based on production main `df3fe061c7df3c4235aa2394623e703a4412ca46`.

Immutable Stage 4 source seal: `7336adda832322bbd93e8c16f3de0e4bbf5273c1`.

On that exact unchanged source-seal head:

- all 14 permanent workflow families passed;
- submitted reviews: 0;
- inline review threads: 0;
- mergeable: true;
- reviewed `firestore.spark.rules` blob: `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`.

Stage 4 source proof covers exact private rivalry attachment, shared authoritative gameplay-state create/read/update for exactly the two paired accounts, registered active writer-device enforcement, both-account-active mutation gating, immutable baseRevision CAS, monotonic revision/hash linkage, atomic SHA-256 idempotency receipts, exact replay without revision increment, reused-key conflict, stale-base conflict, third-account denial, account-disable freeze, device-revocation freeze, tombstone anti-resurrection and continued Stage 5 session-write denial.

The final Rules hardening removes redundant evaluation that exceeded Firestore's 1,000-expression limit while preserving the authorization boundary. A state mutation additionally requires its idempotency receipt to be absent before the transaction, preventing an old receipt from being reused as fresh mutation evidence.

Production Stage 4 Rules have NOT been published. Production still runs the Stage 3 runtime/provider boundary. No Stage 4 production capability claim is authorized yet.

Remote Joining readiness remains `69/100` under `REMOTE_JOINING_READINESS.json` / `RJR-1`. Source code, documentation, green CI, emulator proof and WEC packaging do not move the score.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

A fresh successor must independently verify live main, PR #130, its exact head, workflow/review/mergeability state and current production provider state, initialize a fresh WEC rather than inheriting this environment's `PREPARE_HANDOFF`, then complete the Stage 4 provider-publication and production-proof checkpoint.

Use the exact reviewed Stage 4 `firestore.spark.rules` candidate only after current required tests and provider gates remain satisfied. Record production provider proof, preserve the immutable source seal, and merge/deploy the candidate under the standing owner merge/deploy authorization only when all required gates permit it. Then obtain genuine live Connected Rivalry evidence before changing RJR-1.

Do not ask the owner to repeat Firebase project/Web App setup, Google Auth setup, App Check setup, Stage 2 account bootstrap, Stage 3 device/pairing setup or the already-proven Stage 3 Rules publication.

App Check enforcement remains OFF. Firebase Spark / zero billing remains mandatory. Firestore persistent cache remains disabled/memory-only. No Blaze, Cloud Run, Cloud Functions or Firebase Storage is authorized. Canonical local Save Library authority and Candidate C destructive-Apply exclusivity remain unchanged.

Stage 5 Private Remote Joining session orchestration remains blocked until Stage 4 is genuinely production-proven. Public discovery, community, matchmaking, public invite directories and global leaderboard/rankings remain eliminated.
