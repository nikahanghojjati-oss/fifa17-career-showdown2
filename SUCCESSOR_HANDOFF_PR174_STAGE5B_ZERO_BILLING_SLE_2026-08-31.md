# Successor Handoff — PR #174 / Stage 5B Corrected / Zero-Billing Authorized / RJR87 — SLE 2026-08-31

SLE = Smart Lean Efficient. This is the complete deep-reference successor package.

This handoff is orientation only. Current source, live GitHub/provider/deployment evidence, `REMOTE_JOINING_READINESS.json`, current authority, the successor's fresh WEC and later owner instructions win.

## 1. Repository and live identity

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`.

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`.

Production remains `v1.8.1 / 1.8.1-r5`. Known-good rollback runtime remains `1.8.1-r4`.

PR #173 merged as Stage 5B starting main `c005f69c8952fbce8a4b842e69641e5467c36f9a` with tree `79aec8661b685de20fcd248bb4c92f017b90d3d9`.

PR #174 is `Prove Stage 5B device credential foundation`. Its first implementation proof head/tree are `5b092220ce2507c66cf653e510fbaa2c43fb425d` / `2b525677ba2af016929b0bb1706df9c3f40847aa`.

Pre-seal head `f4689e6b0440e0490875afe74c75b2a218f3dbc6` passed all 14 workflow families. PR #174 remained open when this transition was prepared. The successor must fetch its final exact head, state and evidence.

Production Rules remain exact provider-proven `firestore.spark.rules` blob `2b7c0b166ae0aae7ab7a3ce84725b21091262484`. PR #174 changes no production runtime or provider state.

## 2. Controlling owner authority

`00_OWNER_ZERO_BILLING_REMOTE_JOINING_AUTHORIZATION.md` is the current infrastructure authority.

The owner authorizes every engineering, IAM, provider, authentication-policy, Security Rules, runtime, deployment, testing, evidence, merge and publication decision needed for Remote Joining except billing.

Billing is permanently forbidden unless a later explicit owner instruction changes it. Never link a Cloud Billing account, enable Blaze, attach a payment method or activate a service that requires billing even when it offers a free usage tier.

Standing owner authorization permits merge and deploy after all mandatory gates pass.

All required tests and gates must pass before publication.

## 3. Stage 5B preserved result

`js/sparkDeviceCredential.js` proves a dedicated IndexedDB, non-extractable ECDSA P-256 private key, normalized public JWK fingerprint, exact one-use challenge signatures, reload/offline survival, device conflict denial and no localStorage mutation.

`js/trustedDeviceCredentialIssuance.js` proves recent-Google initial enrollment, enrolled-key refresh, exact two-minute challenge integrity, proof verification, rotation-safe atomic issue/refresh, terminal device-plus-credential revocation and per-sign-in claims `device_id`, `device_credential_version`, `device_key_sha256`.

Deterministic contracts, Chromium and Auth-plus-Firestore emulators proved simultaneous same-UID device claim isolation, refresh survival, replay/tamper/key mismatch denial and immediate denial after active-device revocation.

Stage 5B remains dormant, is not loaded by production and earns zero RJR credit.

## 4. Codex P2 correction

Codex reviewed `f4689e6b` and correctly found that the browser verifier enforced key fingerprint equality while `firestore.stage5a.rules` enforced only `device_id`.

The corrected candidate Rules load `accounts/{uid}/deviceCredentials/{deviceId}` and require:

1. exact `device_id` format and active registered-device authority;
2. integer credential version exactly `1`;
3. exact valid `device_key_sha256`;
4. active credential state;
5. exact stored version and key-fingerprint equality.

The emulator now performs direct Firestore reads using missing, forged, wrong-key and wrong-version claims, so local helper validation cannot mask a Rules defect. Revoked-device denial remains covered. Focused Stage 5A and Stage 5B deterministic contracts pass locally. Exact Java 21 CI owns the final emulator proof because the container exposes Java 17.

## 5. Recovered outage archive

The owner ZIP SHA-256 is `dcf93bbcd6df82c83e64a947babe50fa7349ef35c44be2daaa8ebe5b92d2477e`. Its Git bundle SHA-256 is `051f7dd58e884e66402c0f70f0c43ce48d2b48b44274165a17704b24f81944da`; recovered commit is `4847fa20d11531b697906eabac580da73f385d8e`.

Only its mirrored SLE structure was useful. Its user-wide custom-claim source was rejected because simultaneous devices race, no key possession is proved, stale tokens survive claim clearing while the device stays active and its device-ID format is incompatible.

## 6. Zero-billing architecture decision

Read `ZERO_BILLING_REMOTE_JOINING_ARCHITECTURE_DECISION_2026-08-31.md`.

Firebase's current provider documentation says Spark needs no payment information and includes social sign-in plus bounded Firestore quotas. It also says Cloud Run requires linked billing and moves the project to Blaze. The owner's stricter rule therefore excludes Cloud Run even if usage might stay in a free tier.

Stage 5B remains preserved as research and is not the production critical path; its trusted custom-token issuer stays dormant.

The selected production critical path is existing Google Authentication plus direct Cloud Firestore client operations protected by exact-path deny-by-default Rules on Spark and the existing GitHub Pages frontend.

## 7. Next product slice

The next bounded slice is `stage5c-zero-billing-standard-auth-session-adapter`.

It must:

1. use standard Google-token `request.auth.uid` as provider identity;
2. preserve exact opaque capability access and deny collection listing;
3. preserve exactly two entitled rivalry accounts;
4. preserve host-only open, peer-only join and terminal close, revoke and expiry transitions;
5. treat device IDs only as account-owned mutation metadata, never provider-bound cryptographic identity;
6. keep Firestore memory-only and local-first fallback;
7. prove missing auth, wrong account, third account, inactive account, invalid device metadata, listing, stale revision, expiry and terminal replay denial in deterministic and Auth-plus-Firestore emulators;
8. keep production Rules publication, runtime host/join UX, two-network acceptance and RJR credit as later separately reviewed gates.

Quota exhaustion must fail safely and must never trigger billing.

## 8. Fixed readiness

`REMOTE_JOINING_READINESS.json` remains sole numeric authority. Remote Joining readiness remains `87/100` with domain vector `20/20`, `18/20`, `20/20`, `20/30`, `9/10`.

PR #174's correction, authority, architecture decision, source, emulators, CI, review, SLE and publication earn zero points. Production-live playable evidence is required for movement.

## 9. Permanent locks

Exactly two private managers and no public listing, discovery, community, matchmaking, rankings or leaderboards.

Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`. `activeShowdown` remains non-canonical.

Candidate A remains non-mutating, Candidate B read-only and Candidate C the sole destructive remote-to-local Apply authority with transaction-owned exact rollback.

Firebase remains Spark with no billing account. Firestore remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. App Check enforcement remains OFF. The protected historical rivalry remains untouched.

## 10. Production exclusions at handoff

No production Rules, Auth provider, custom token, IAM, billing, App Check enforcement, runtime route, session document, host/join UX, local Save, canonical storage, Candidate C, Connected Rivalry or protected rivalry mutation occurred.

Production session Rules remain excluded from PR #174 and are a later separately reviewed gate.

Production remains `v1.8.1 / 1.8.1-r5`.

## 11. WEC boundary

Environment `we-2026-08-31-stage5b-device-credential-foundation` assessed `HANDOFF_NOW` after the owner decision and valid P2 arrived. Its final package must be validated and archived, but its transition decision and counters must not be inherited.

The successor creates a fresh unique WEC from independently observed live main, resets every per-environment counter, records current PR/provider state, runs `npm run work:assess` and obeys its own decision.

## 12. PR #174 publication gate

If PR #174 remains open, finish only this bounded publication before Stage 5C:

1. fetch final exact head and changed files;
2. require all 14 permanent workflow families;
3. inspect the Java 21 Stage 3 job for the corrected wrong-key and wrong-version Rules denial markers;
4. request final-head Codex review and classify every thread;
5. correct every valid finding and rerun exact-head gates;
6. verify mergeability;
7. expected-head squash merge under standing authorization;
8. require all normal post-merge workflow families plus Pages;
9. verify live main tree, public `1.8.1-r5` and unchanged production Rules blob.

Do not infer success from this handoff.

## 13. IMMEDIATE NEXT TASK AFTER FULL STUDY

First independently verify and, if needed, finish PR #174's corrected publication exactly as section 12 requires.

Then validate/archive the predecessor WEC, initialize a fresh WEC and assess it.

Only when the fresh WEC permits new product work, implement `stage5c-zero-billing-standard-auth-session-adapter`. Do not activate billing or Cloud Run, do not request the already-granted non-billing authority and do not make dormant custom-token issuance a prerequisite.

Do not repeat consumed pairing, Candidate C, accepted replay, adverse-provider, token-lifecycle, structural-abuse, rate-limit, rollback, provider-Rules or provider-abuse proof merely for confidence. Do not fabricate provider, device, network or session state.

## 14. Recursive SLE and reporting

At Handoff proximity 100%, provide a short repository-first next-developer prompt that points to the versioned starter and this mirrored handoff before stopping.

Every substantive owner update uses exactly:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Estimated focused sessions to genuine RJR100: ~N–M
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...

At Handoff proximity 100%, complete a root SLE handoff plus byte-identical project mirror, a new versioned starter plus byte-identical mirror, refresh `SESSION_BOOTSTRAP.json` and progressive context, preserve exact live/WEC/security/RJR evidence, run applicable SLE contracts and `npm run work:next-prompt`, make the final WEC seal the last branch mutation, provide the short repository-first prompt and stop before the next substantial milestone.

Every successor recursively preserves SLE, WEC, fixed RJR evidence discipline, the zero-billing owner authority, standing gated publication authorization and this exact reporting format.
