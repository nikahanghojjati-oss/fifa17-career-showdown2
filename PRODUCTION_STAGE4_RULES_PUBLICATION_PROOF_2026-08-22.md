# Stage 4 Connected Rivalry — Production Firestore Rules Publication Proof — 2026-08-22 ET

Status: **PROVIDER RULES PUBLISHED / SEALED-RULES IDENTITY VERIFIED / RUNTIME DEPLOYMENT PENDING / CONNECTED RIVALRY PRODUCTION CAPABILITY NOT YET PROVEN**

Current source, live GitHub/provider/deployment state and later owner instructions override this record.

## Immutable source authority

- Pull request: `#130` — `v1.7.0 Stage 4: Connected Rivalry`
- Branch: `agent/v1.7.0-connected-rivalry-state`
- Immutable Stage 4 runtime/source seal: `7336adda832322bbd93e8c16f3de0e4bbf5273c1`
- Reviewed Stage 4 `firestore.spark.rules` Git blob: `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`
- Previous production Stage 3 Rules Git blob: `bf307c52262faf81a484e33cde272ac831fe60f0`

## Production provider evidence

Before mutation, the owner copied the complete Rules text from Firebase Console → Firestore Database → `(default)` → Rules. The copied bytes reproduced the exact previously reviewed Stage 3 Rules Git blob `bf307c52262faf81a484e33cde272ac831fe60f0`, establishing that production still held the known Stage 3 provider boundary immediately before the Stage 4 publication.

The owner then performed one replace-all publication using the exact immutable Stage 4 Rules candidate. No Firebase project/Web App, Google Auth, App Check, Stage 2 account bootstrap, Stage 3 device/pairing setup or Stage 3 Rules setup was repeated.

After publication:

- the owner-provided Firebase Console screenshot showed a newly selected Rules version labeled `Today · 8:44 AM` on 2026-08-22 ET;
- the visible top of the published Rules contained the Stage 4-only `validIdempotencyKeyHash` function;
- the owner copied the complete newly published Rules text back from the Firebase editor;
- computing the Git blob SHA from those exact copied bytes produced `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`, exactly matching the reviewed Stage 4 Rules blob at the immutable source seal.

Therefore the Stage 4 Firestore Rules provider-publication gate is closed with source-identity evidence. No additional Rules publication is required unless later live evidence proves a regression or a separately reviewed change intentionally replaces this blob.

## What this publication authorizes

The published Rules add the bounded Stage 4 Connected Rivalry shared-state boundary already source/emulator-proven on the immutable seal: active two-account rivalry gating, active registered writer-device enforcement, authoritative shared-state create/update, immutable-base CAS, monotonic revision/hash linkage, atomic SHA-256 idempotency receipts, stale/reused-key conflict behavior and continued Stage 5 session-write denial.

Protected boundaries remain unchanged: Firebase Spark / zero billing, App Check enforcement OFF, popup-only Google authentication with `browserSessionPersistence`, memory-only Firestore, no Blaze/Cloud Run/Cloud Functions/Firebase Storage, exact three-key canonical localStorage, Candidate C as sole destructive local Apply authority, no public discovery/community/matchmaking/public invite directories/global leaderboard/rankings, and exactly two managers.

## Production status after Rules publication

This provider publication does **not** by itself prove the `v1.7.0 / 1.7.0-r1` runtime or Connected Rivalry behavior in production. Until PR #130 is merged, GitHub Pages deployment is verified and genuine live Connected Rivalry behavior is demonstrated, the last production-proven whole runtime remains `v1.6.0 / 1.6.0-r1`.

Remote Joining readiness remains `69/100` under RJR-1. Provider publication, documentation, source, CI and emulator proof do not independently move that score.

## Next safe action

Revalidate PR #130 after this continuity/provider-proof commit: exact head, source-seal preservation, all required workflow families, submitted reviews, inline review threads and mergeability. If all gates remain clean, mark the PR ready and merge/deploy under the standing owner authorization with expected-head protection. Then obtain genuine live Connected Rivalry production evidence before changing RJR-1 or beginning Stage 5.
