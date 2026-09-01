# START NEXT SESSION — v1.4.34 / PR #175 / RJR87 / Stage 5C Standard-Auth Candidate

SLE = Smart Lean Efficient. Work Environment Continuity (WEC) remains mandatory.

This starter is orientation only. Current source, live GitHub/provider/deployment evidence, `REMOTE_JOINING_READINESS.json`, `NEXT_TASK.md`, `PROJECT_STATE.md`, the successor's fresh WEC and later owner instructions win.

## Verified boundary

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`.

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`.

PR #174 is fully merged at live main `48ceef1e8c9986fdfe346de1a7151a31f314044b` with tree `ec5425c330e6ec80ab6e032b75f0bc316abb2c48`. Its 14 exact-head workflow families, final-head Codex review, zero unresolved threads, expected-head squash merge, 15 post-merge/Pages runs and 94-file deployment verification are complete.

Production remains `v1.8.1 / 1.8.1-r5`, DEPLOYED / PRODUCTION-PROVEN. Production runtime lineage remains PR #166 merge `32c32afb1365c9ae6120d810a68e5c72c4b8229a`; `1.8.1-r4` remains the immediate known-good rollback runtime. Production Rules remain exact provider-proven `firestore.spark.rules` blob `2b7c0b166ae0aae7ab7a3ce84725b21091262484`.

PR #175 is `Prove Stage 5C zero-billing standard-auth session adapter` on branch `rjr/stage5c-zero-billing-standard-auth-session-adapter-2026-09-01`.

Its first published implementation proof head/tree are `cd41261270da53c75313b157625b6d4ac00661c8` / `3cf6baee5b17da852fbad0bf0452681654004798`. The successor must fetch the final exact PR head rather than infer publication or merge state from this starter.

Fixed Remote Joining readiness remains `87/100` under RJR-1. Candidate source, emulators, CI, review, SLE, publication and merge mechanics receive zero capability credit.

## Controlling owner authorization

Read `00_OWNER_ZERO_BILLING_REMOTE_JOINING_AUTHORIZATION.md` and `ZERO_BILLING_REMOTE_JOINING_ARCHITECTURE_DECISION_2026-08-31.md`.

The owner authorizes every remaining engineering, IAM, provider, authentication-policy, Security Rules, runtime, deployment, testing, evidence and publication decision needed for Remote Joining except billing.

Billing must never be activated. Do not link Cloud Billing, enable Blaze, add a payment method, activate Cloud Run or use any service whose activation requires billing even if it advertises a free tier. Firebase must remain Spark.

Standing owner authorization permits merge and deploy after all required tests and current mandatory gates pass. Do not ask again for already-granted nonbilling production authority.

## PR #175 candidate result

Stage 5C implements the smallest honest Spark-native session candidate:

Registered device IDs are account-owned mutation metadata and are not authentication.

1. `js/sparkStandardAuthPrivateSession.js` adapts the existing Stage 5 lifecycle to ordinary Firebase authenticated `uid` authority.
2. Standard-auth mode in `js/sparkPrivateSession.js` requires a Firebase user plus normalized account-owned registered-device metadata, but never claims physical-browser or cryptographic device authentication.
3. `firestore.stage5c.rules` removes the Stage 5B custom device-claim dependency inside an explicitly marked candidate-only session boundary.
4. Exact session gets require authenticated Firebase UID, the opaque 256-bit capability path and current two-account rivalry entitlement. Rules cannot prove physical-browser possession from a client-supplied device ID.
5. Session mutations additionally require the named active registered-device document under the authenticated account and bind `updatedByAccountId` to `request.auth.uid`.
6. Host-only open, peer-only join, immutable membership, monotonic CAS, expiry, close/revoke and terminal no-resurrection remain enforced.
7. Collection listing, discovery, lobbies, community, matchmaking, rankings and more than two managers remain denied.
8. Firestore remains memory-only. Provider or Spark quota exhaustion fails closed while local play remains available and never triggers billing.

The Stage 5B non-extractable P-256 key, one-use proof, per-sign-in `device_id` / `device_key_sha256` custom-token claims and atomic revocation remain preserved dormant research. They are not the production critical path because their Cloud Run issuer would require billing.

The production critical path remains standard Google Auth plus exact-path Firestore Rules on Spark.

## Automated evidence

All 80 repository contract files pass.

Five focused post-fix loading visual repetitions plus the permanent workflow-mirror run pass across desktop, windowed desktop, mobile-browser and iOS-standalone profiles. The audit now waits for the dynamically loaded fidelity/offline stylesheet before reading computed `object-fit`, closing the post-merge timing race without changing runtime assets.

Stage 5A, Stage 5B and Stage 5C deterministic tests pass. Java-17-compatible Firebase emulator suites pass for Stage 5A Firestore, Stage 5B Auth-plus-Firestore and Stage 5C Auth-plus-Firestore.

The Stage 5C Auth Emulator issues ordinary Firebase UID tokens with no custom device claims. The Firestore matrix proves missing auth, wrong or third account, inactive account, list denial, missing/revoked device mutation denial, stale CAS denial, delete denial, expiry and terminal no-resurrection.

The permanent local workflow mirror passed 29 executable blocks and explicitly deferred only the pinned Firebase CLI 15.28.1 / Java 21 provider block to exact GitHub Actions CI.

PR #175 must not merge until all 14 exact-head workflow families pass on its unchanged final head, including the Java 21 Stage 5C Auth-plus-Firestore PASS.

## Production non-changes

`firestore.stage5c.rules` is not referenced by `firebase.json` or any deployment workflow. The adapter is not loaded by `index.html` or production runtime. Host/join UX is not exposed and no production session data exists.

PR #175 does not change production Rules, runtime assets, Firebase Auth provider policy, App Check enforcement, IAM, billing, canonical storage, local Saves, Candidate C, Connected Rivalry or the protected historical rivalry.

Production session Rules publication is excluded from PR #175 and remains a later separately reviewed gate. Runtime host/join UX remains separate after Rules publication. Provider-live playable acceptance remains separate after both.

Permanent locks remain: exactly two private managers; exact capability and no listing; canonical localStorage exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; Candidate C sole destructive remote-to-local Apply authority; Firestore memory-only; Google popup-only `browserSessionPersistence` with no extra scopes; App Check enforcement remains OFF; no public discovery, community, matchmaking or rankings.

## WEC boundary

Environment `we-2026-09-01-stage5c-zero-billing-standard-auth-session-adapter` independently started from live main `48ceef1e8c9986fdfe346de1a7151a31f314044b`.

After implementation and complete local proof, its reassessment is `HANDOFF_AT_CHECKPOINT`: finish only PR #175's already-bounded publication, seal the complete successor package and stop before the distinct production Rules milestone.

The successor validates and archives this WEC, initializes a fresh unique WEC from independently observed live main with every per-environment counter reset, runs `npm run work:assess` and obeys its own decision. Never inherit this environment's transition decision or counters.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Independently verify live main, PR #175 exact final head/tree/state, changed files, all workflow families, reviews, review threads and mergeability.

2. If PR #175 remains open, finish only its bounded candidate publication. Require all 14 workflow families on one unchanged exact head, inspect the Java 21 Stage 5C Auth-plus-Firestore job, request final-head Codex review, classify and resolve every valid thread, verify mergeability and expected-head squash merge under standing authorization.

3. Verify all 15 normal post-merge/Pages runs, live main and tree, the public `1.8.1-r5` deployment, 94-file byte identity where applicable, and unchanged production `firestore.spark.rules` blob `2b7c0b166ae0aae7ab7a3ce84725b21091262484`.

4. Validate/archive the closing WEC and initialize a fresh successor WEC. Only if that fresh WEC permits product work, begin the distinct minimum production session Rules review/publication gate from `firestore.stage5c.rules`. Do not combine Rules publication with runtime host/join UX.

5. Continue dependency-gated toward a genuinely playable free Remote Joining path: production Rules, runtime host/join UX, provider-live two-account acceptance, real two-device/two-network reconnect/token/adverse-network hardening and final stable release acceptance. Credit RJR only when the fixed ledger's genuine evidence requirements are met.

Do not repeat consumed pairing, Candidate C, accepted replay, adverse-provider, token-lifecycle, structural-abuse, rate-limit, rollback, provider-Rules or provider-abuse proof merely for confidence. Do not fabricate provider, device, network or session state.

## Recursive SLE and reporting

The normal owner entrypoint is one short repository-first next-developer prompt. Generate it with `npm run work:next-prompt`; it must point to this starter and the mirrored deep handoff.

Every substantive owner update uses exactly:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Estimated focused sessions to genuine RJR100: ~N–M
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...

At Handoff proximity 100%, complete a byte-identical mirrored SLE handoff and versioned starter, refresh `SESSION_BOOTSTRAP.json` and progressive context, run applicable SLE contracts and `npm run work:next-prompt`, make the final WEC seal the last intended branch mutation, provide the short repository-first prompt and stop before another substantial milestone.

Every successor recursively preserves SLE, WEC, fixed RJR evidence discipline, zero-billing authority, standing gated publication authorization, the repository-first next-developer prompt rule and this exact reporting format.
