# START NEXT SESSION — v1.4.32 / PR #174 / RJR87 / Stage 5B Credential Candidate

SLE = Smart Lean Efficient. Work Environment Continuity (WEC) remains mandatory.

This starter is orientation only. Current source, live GitHub/provider/deployment evidence, `REMOTE_JOINING_READINESS.json`, `NEXT_TASK.md`, `PROJECT_STATE.md`, the successor's fresh WEC and later owner instructions win.

## Verified transition boundary

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`.

Production application/runtime remains `v1.8.1 / 1.8.1-r5`, production-proven and unchanged.

PR #173 merged from exact final head `449ba80b3ebd7e74afab5edc197be15876cd7e96` to live-main squash `c005f69c8952fbce8a4b842e69641e5467c36f9a`; both have tree `79aec8661b685de20fcd248bb4c92f017b90d3d9`. All 14 exact-head workflows, all 15 post-merge runs including Pages and the 92-file deployment verifier passed.

PR #174: `Prove Stage 5B device credential foundation`.

First published implementation proof head: `5b092220ce2507c66cf653e510fbaa2c43fb425d`.

First published implementation tree: `2b525677ba2af016929b0bb1706df9c3f40847aa`.

Candidate proof: `STAGE5B_DEVICE_CREDENTIAL_FOUNDATION_PROOF_2026-08-31.md`.

Production Rules remain exact provider-proven `firestore.spark.rules` blob `2b7c0b166ae0aae7ab7a3ce84725b21091262484`.

Fixed Remote Joining readiness remains `87/100` under RJR-1. Source, emulator, browser, CI, PR, merge, SLE and publication work receive zero production capability credit.

The closing developer must independently verify PR #174's final exact head, all required workflows, reviews, inline threads, mergeability, squash merge, post-merge workflows, Pages/live main and unchanged production truth. Recorded candidate facts never override live evidence.

## What Stage 5B proves

`js/sparkDeviceCredential.js` creates one origin-bound ECDSA P-256 private key through Web Crypto with `extractable: false`, stores it only in a dedicated IndexedDB database, exports only the normalized public JWK and signs exact one-use trusted challenges. It adds no `localStorage` key and is not loaded by production.

`js/trustedDeviceCredentialIssuance.js` is a provider-neutral trusted candidate. Initial enrollment requires a recent Google principal; refresh requires the already-enrolled private key; completion verifies exact account, device, key fingerprint, challenge lifetime and signature before an atomic provider commit. It mints per-sign-in Firebase custom-token claims only after that commit.

Revocation requires recent Google reauthentication and one atomic commit that terminally revokes both the registered-device state and credential state. Candidate Stage 5A Rules recheck the active registered-device document on every operation, so an already-issued token for a revoked device is denied while another active device remains authorized.

Chromium proves the non-extractable key survives reload and offline use, signs correctly, stays out of localStorage and cannot be reused under another device ID. Real Firebase Auth plus Firestore emulators prove two simultaneous custom-token sessions for one UID retain distinct `device_id` claims through forced refresh, and missing, forged, mismatched and revoked credentials fail closed.

The owner-supplied Codex outage archive was checksum-verified and reviewed. Its v1.4.32 SLE structure was useful. Its user-wide custom-claim implementation was rejected because it races simultaneous devices, lacks key proof, does not immediately revoke already-issued tokens and uses an incompatible device-ID format. No archive code replaced PR #174's stronger implementation.

## What did not change

Production does not issue the candidate `device_id` claim and no production custom token exists. Production session Rules were not published. Runtime scripts, trusted routes and host/join UX were not activated.

Firebase remains Spark / zero billing. The reviewed trusted runtime remains unactivated and IAM remains unbroadened. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. App Check enforcement remains OFF. Firestore client persistence remains memory-only.

No production account, device, rivalry or session was created or mutated. No local Save, canonical localStorage key, Candidate C authority, Connected Rivalry gameplay authority or protected historical rivalry changed.

Exactly two managers, exact private capability/no listing, no public discovery, lobbies, matchmaking, community, profiles, rankings or leaderboards remain permanent locks.

## Production activation blocker

The proven safe architecture cannot be activated while all current locks remain simultaneously true. Production activation requires explicit owner authority for:

1. Blaze billing so the selected Cloud Run trusted runtime can exist;
2. secondary Firebase custom authentication while preserving the primary Google session;
3. the exact additional IAM permissions `iam.serviceAccounts.signBlob` and `datastore.entities.update` after least-privilege review;
4. a provider-proven Firestore challenge/key/revocation adapter before any production session Rules publication.

Weakening Rules to account-only access, using user-wide `setCustomUserClaims` for per-device state or trusting a browser-supplied identifier is forbidden.

## Closing WEC

Closing environment: `we-2026-08-31-stage5b-device-credential-foundation`.

Its `HANDOFF_AT_CHECKPOINT` decision belongs only to this environment. Validate its schema and additions-only closure, then initialize a fresh unique successor WEC from independently observed live main with reset counters. Never inherit the predecessor's transition decision.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Independently verify PR #174 final exact head/state, all 14 permanent workflow families, reviews, inline threads, mergeability, squash merge, post-merge workflows, Pages, live main, public `v1.8.1 / 1.8.1-r5` and unchanged provider Rules. If publication was interrupted, finish only that bounded checkpoint after every required gate is clean.

2. Validate/archive WEC `we-2026-08-31-stage5b-device-credential-foundation`, initialize a fresh unique WEC with reset counters from observed live main, run `npm run work:assess` and obey that environment's own decision.

3. If no explicit owner activation authority has been supplied, preserve the evidence-backed blocker and request the smallest exact decision: whether Blaze/Cloud Run, secondary custom Auth and the two named IAM permissions are authorized. Do not silently broaden any lock.

4. If explicitly authorized and the fresh WEC permits, implement only the separately reviewed production adapter/provider proof. Keep production session Rules publication, runtime host/join UX and RJR credit as later distinct gates.

Do not repeat consumed pairing, Candidate C reconciliation, exact replay, generic adverse-provider, token-lifecycle, abuse, rate-limit, rollback, provider-Rules or provider-abuse proof merely for confidence. Do not fabricate identity, device, network, provider or session state.

## Standing authorization and publication gates

Standing owner merge/deploy authorization remains active through project completion only after all applicable tests, exact-head workflows, reviews, threads, mergeability, deployment and live-verification gates pass. Later explicit owner instructions override it.

Every substantive owner update uses exactly:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Estimated focused sessions to genuine RJR100: ~N–M
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...

At Handoff proximity 100%, generate and publish the complete mirrored SLE package, make the WEC seal the final intended branch mutation, give the owner the short repository-first prompt and stop before another substantial milestone.

Future closers run `npm run work:next-prompt`. Every successor recursively preserves SLE, WEC, fixed RJR evidence discipline, permanent locks, standing gated publication authorization, the exact eight-line report and the repository-first next-developer prompt rule.
