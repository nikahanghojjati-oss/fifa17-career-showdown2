# Stage 5D Minimum Production Session Rules Gate Proof — 2026-09-01

Status: SOURCE PROMOTION CANDIDATE — PROVIDER PUBLICATION NOT YET CLAIMED

Remote Joining readiness remains fixed at 87/100. This Rules source review, repository publication, CI, review and merge mechanics receive zero capability credit. RJR can move only after provider-live playable evidence materially proves a previously uncredited fixed-domain capability.

## Exact reviewed promotion

The minimum production private-session Rules source is promoted by byte identity from the already proven Stage 5C standard-auth candidate:

- source candidate: `firestore.stage5c.rules`
- candidate / promoted Git blob: `363af783d7e5436fdfaa3766d4aa413fc9952a08`
- production source path: `firestore.spark.rules`
- prior provider-proven production blob: `2b7c0b166ae0aae7ab7a3ce84725b21091262484`

No new Rules semantics are authored in Stage 5D. The production source receives the exact Stage 5C bytes that already passed deterministic contracts plus the real Firebase Auth and Firestore emulator matrix. Retaining the Stage 5C marker comments is deliberate provenance: they identify the already reviewed boundary and do not alter Rules behavior.

## Security boundary retained

The promoted Rules use ordinary Firebase `request.auth.uid` account authority. Registered device IDs remain account-owned mutation metadata and are not represented as physical-browser or cryptographic authentication.

Exact session gets require the opaque 256-bit capability path plus current two-account rivalry entitlement. Session collection listing remains denied. Host-only open, peer-only join, immutable two-account membership, monotonic CAS, expiry, host revoke, member close and terminal no-resurrection remain enforced. Session mutations additionally require the named active registered-device document under the authenticated account and bind `updatedByAccountId` to `request.auth.uid`.

No public discovery, lobby, community, matchmaking or rankings path is added. The final recursive deny-by-default rule remains present.

## Production separation

This is a Rules-only milestone. `js/sparkStandardAuthPrivateSession.js` remains dormant and is not loaded by `index.html`, `js/app.js`, `js/productionFirebaseRuntime.js` or `service-worker.js`. Host/join UX is not exposed. Canonical local storage is untouched and Candidate C remains the sole destructive remote-to-local Apply authority.

`firebase.json` remains on the historical emulator lane and still points to `firestore.rules`. The isolated production deployment config remains `firebase.production.rules.json` and targets `firestore.spark.rules` only.

The production environment manifest must continue to record the previously provider-proven blob `2b7c0b166ae0aae7ab7a3ce84725b21091262484` until a new provider publication is independently verified. Repository source promotion must not be misreported as provider activation.

## Zero-billing lock

Firebase remains Spark. Billing must never be activated. Do not link Cloud Billing, enable Blaze, add a payment method, activate Cloud Run or use a service whose activation requires billing. App Check enforcement remains OFF. Firestore persistence remains memory-only. Spark quota or provider exhaustion must fail closed while local-first play remains available and must never trigger an upgrade or charge.

## Required publication gates

Before provider publication:

1. the exact promoted source must remain byte-identical to the Stage 5C proven blob;
2. the full repository contract suite must pass including the Stage 5D source-lineage contract;
3. all 14 permanent exact-head workflow families must pass on one unchanged final PR head;
4. Java 21 Stage 5C Auth-plus-Firestore emulator proof must pass on that exact head;
5. final-head Codex review must complete and every valid thread must be resolved;
6. mergeability and expected-head squash merge must be verified;
7. normal post-merge/Pages gates and unchanged runtime deployment must pass.

Only after those gates may the exact reviewed `firestore.spark.rules` source be published to Firebase production using the existing isolated Spark-compatible Rules deployment route. Provider source identity must then be independently verified and recorded before the environment claims `stage5CProductionRulesPublished=true`.

## Explicit non-changes

No runtime version bump. No host/join UI. No production session document is created. No Auth provider policy change. No custom token or custom device claims. No IAM expansion. No App Check enforcement change. No billing. No Cloud Run. No Storage or Functions initialization. No local Save mutation. No public discovery. No destructive test against the protected historical rivalry.
