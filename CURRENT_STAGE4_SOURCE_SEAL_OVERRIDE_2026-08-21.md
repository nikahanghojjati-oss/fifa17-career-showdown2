# CURRENT OVERRIDE — Stage 4 Connected Rivalry Source Seal + Provider Publication — 2026-08-22 ET

Current source, live GitHub state, provider state and later owner instructions override this record.

Production whole-runtime proof remains `v1.6.0 / 1.6.0-r1`, with Stage 3 Registered Devices / Private Pairing production-proven. Stage 4 remains a `v1.7.0 / 1.7.0-r1` RELEASE CANDIDATE until PR #130 is merged/deployed and genuine Connected Rivalry production behavior is proven.

PR #130 `v1.7.0 Stage 4: Connected Rivalry` is on branch `agent/v1.7.0-connected-rivalry-state`, based on production main `df3fe061c7df3c4235aa2394623e703a4412ca46`.

Immutable Stage 4 runtime/source seal: `7336adda832322bbd93e8c16f3de0e4bbf5273c1`.

On that exact unchanged source-seal head:

- all 14 permanent workflow families passed;
- submitted reviews: 0;
- inline review threads: 0;
- mergeable: true;
- reviewed `firestore.spark.rules` blob: `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`.

Stage 4 source proof covers exact private rivalry attachment, shared authoritative gameplay-state create/read/update for exactly the two paired accounts, registered active writer-device enforcement, both-account-active mutation gating, immutable baseRevision CAS, monotonic revision/hash linkage, atomic SHA-256 idempotency receipts, exact replay without revision increment, reused-key conflict, stale-base conflict, third-account denial, account-disable freeze, device-revocation freeze, tombstone anti-resurrection and continued Stage 5 session-write denial.

The final Rules hardening removes redundant evaluation that exceeded Firestore's 1,000-expression limit while preserving the authorization boundary. A state mutation additionally requires its idempotency receipt to be absent before the transaction, preventing an old receipt from being reused as fresh mutation evidence.

## 2026-08-22 production provider update

Production Firestore Rules for Stage 4 are now PUBLISHED.

Immediately before publication, the owner's complete Firebase Rules copy reproduced exact Stage 3 Rules blob `bf307c52262faf81a484e33cde272ac831fe60f0`. After one replace-all publication using the immutable Stage 4 candidate, Firebase Console showed a new Rules version at `8:44 AM` ET and the complete newly published Rules copy reproduced exact Stage 4 reviewed blob `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`.

Canonical provider evidence: `PRODUCTION_STAGE4_RULES_PUBLICATION_PROOF_2026-08-22.md`.

Do not ask the owner to republish these Rules or repeat any prior Firebase setup unless concrete live regression evidence or a separately reviewed intentional Rules change requires it.

This closes the Stage 4 provider-publication gate only. It does NOT yet establish `v1.7.0 / 1.7.0-r1` as the production-proven whole runtime and does not by itself prove Connected Rivalry behavior on the deployed site.

Remote Joining readiness therefore remains `69/100` under `REMOTE_JOINING_READINESS.json` / `RJR-1`. Provider publication, source code, documentation, green CI, emulator proof and WEC packaging do not independently move the score.

## IMMEDIATE NEXT TASK

Revalidate the new PR #130 continuity/provider-proof head while preserving `7336adda832322bbd93e8c16f3de0e4bbf5273c1` as immutable runtime/source seal. Require all permanent workflow families green, zero submitted reviews, zero inline review threads and clean mergeability. Then mark ready and squash merge with expected-head protection under standing owner authorization, verify GitHub Pages deployment of `v1.7.0 / 1.7.0-r1`, and obtain genuine live Connected Rivalry production capability evidence before changing RJR-1.

After first Stage 4 production proof, perform focused Stage 4 hardening: two physical devices, revoked-device/adverse-network/token behavior, stale/replay/local-vs-remote UX, sleep/wake/refresh. Before Stage 5, complete the explicit reviewed remote-to-local reconciliation contract so remote observed state cannot casually clobber canonical local Save Library and Candidate C's destructive-Apply authority is not bypassed.

Do not repeat Firebase project/Web App setup, Google Auth setup, App Check setup, Stage 2 account bootstrap, Stage 3 device/pairing setup or Stage 3 Rules publication.

App Check enforcement remains OFF. Firebase Spark / zero billing remains mandatory. Firestore persistent cache remains disabled/memory-only. No Blaze, Cloud Run, Cloud Functions or Firebase Storage is authorized. Canonical local Save Library authority and Candidate C destructive-Apply exclusivity remain unchanged.

Stage 5 Private Remote Joining session orchestration remains blocked until Stage 4 is genuinely production-proven and the pre-Stage-5 reconciliation gate is complete. Public discovery, community, matchmaking, public invite directories and global leaderboard/rankings remain eliminated.
