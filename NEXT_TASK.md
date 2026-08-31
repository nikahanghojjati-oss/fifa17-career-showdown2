# CURRENT OVERRIDE — PR #174 STAGE 5B CREDENTIAL CANDIDATE — OWNER ACTIVATION DECISION NEXT — 2026-08-31 UTC

This section supersedes every lower historical instruction. SLE = Smart Lean Efficient and WEC remain mandatory.

Status: production remains `v1.8.1 / 1.8.1-r5`, DEPLOYED / PRODUCTION-PROVEN. PR #173 is merged at live main `c005f69c8952fbce8a4b842e69641e5467c36f9a` after all exact-head/post-merge/Pages/deployment gates passed. PR #174 contains dormant Stage 5B credential foundation source and proof only. Fixed RJR-1 remains `87/100`; candidate/source/emulator/publication work earns zero production credit.

Production runtime lineage remains PR #166 merge `32c32afb1365c9ae6120d810a68e5c72c4b8229a`; known-good rollback runtime remains `1.8.1-r4` and rollback proof run `33190961085` remains consumed.

Current environment: `we-2026-08-31-stage5b-device-credential-foundation`.

Current branch: `rjr/stage5b-device-credential-foundation-2026-08-31`.

Current publication checkpoint: PR #174 `Prove Stage 5B device credential foundation`.

First published implementation proof head/tree: `5b092220ce2507c66cf653e510fbaa2c43fb425d` / `2b525677ba2af016929b0bb1706df9c3f40847aa`.

Candidate proof: `STAGE5B_DEVICE_CREDENTIAL_FOUNDATION_PROOF_2026-08-31.md`.

Implemented/proven through deterministic contracts, Chromium and real Auth-plus-Firestore emulators: non-extractable P-256 key persistence outside localStorage; exact two-minute one-use proof; recent-Google initial enrollment; same-key refresh; exact local/provider fingerprint match; rotation-safe atomic commit; per-sign-in Firebase custom-token claims; terminal atomic device-plus-credential revocation; simultaneous same-UID Device A/Device B claims across forced refresh; missing/forged/mismatched/revoked denial against candidate Stage 5A Rules.

Production remains unchanged: no custom token, custom-Auth sign-in, production issuer, trusted route, IAM grant, billing change, production session Rules, runtime loading or host/join UX. `firestore.spark.rules` remains provider-proven blob `2b7c0b166ae0aae7ab7a3ce84725b21091262484`.

Closed capability authority remains consumed: exact accepted-result idempotency replay remains evidence-proven, and TOKEN-LIFECYCLE SAFETY PRODUCTION-PROVEN remains protected by `tests/contracts/stage4-token-lifecycle-contracts.cjs`. Do not repeat either merely for confidence.

The recovered Codex outage bundle commit `4847fa20d1` was reviewed. Its v1.4.32 SLE layout was useful; its user-wide custom-claim mechanism was rejected because it races simultaneous devices, lacks key possession, leaves stale tokens authorized while devices stay active and uses an incompatible device-ID format.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

First finish and independently verify PR #174 exact-head publication: all 14 permanent workflow families, reviews, inline threads, mergeability, expected-head squash merge, normal post-merge validation, Pages/live main, unchanged public `v1.8.1 / 1.8.1-r5` and unchanged production/provider Rules.

Then validate/archive WEC `we-2026-08-31-stage5b-device-credential-foundation`, initialize a fresh unique WEC from observed live main with reset counters and assess it independently.

If no explicit owner authority changes the current locks, stop at the evidence-backed activation gate and request one exact decision. Safe production activation requires Blaze/Cloud Run, secondary Firebase custom authentication and least-privilege additions `iam.serviceAccounts.signBlob` plus `datastore.entities.update`. Standing merge/deploy authorization does not silently authorize billing, provider-policy or IAM expansion.

If and only if the owner explicitly authorizes those exact changes and the fresh WEC permits, implement a separate production challenge/key/revocation adapter and provider proof. Production session Rules review/publication, runtime loading, host/join UX and RJR movement remain later separate slices.

Permanent locks remain: exactly two managers; exact private capability/no listing; three canonical localStorage keys; Candidate C sole destructive Apply authority; current Firebase Spark/zero billing; Firestore memory-only; popup-only `browserSessionPersistence`; App Check enforcement OFF; trusted IAM unactivated/unbroadened; no public discovery/community/matchmaking/rankings; protected historical rivalry untouched. Only later explicit owner authority may change an exact infrastructure lock.

Do not use user-wide `setCustomUserClaims` for per-device state, weaken Rules to account-only entitlement, trust browser identifiers, repeat consumed proof or fabricate unavailable state.

---

The material below is preserved historical PR #173 transition authority and is superseded by the current override above.

# CURRENT OVERRIDE — PR #173 STAGE 5A CANDIDATE PROVEN — PROVIDER DEVICE CREDENTIAL NEXT — 2026-08-31 UTC

This section supersedes every lower historical instruction. SLE = Smart Lean Efficient and WEC remain mandatory.

Status: production remains `v1.8.1 / 1.8.1-r5`, DEPLOYED / PRODUCTION-PROVEN. PR #172 is merged at Stage 5A starting main `4c12d68dacc0112c7c0fe70d4f1a25e3df7de5de`. PR #173 implements the separate dormant private-session client, isolated candidate minimum Rules, deterministic contracts and real Firestore emulator proof. Fixed RJR-1 remains `87/100`; emulator/source/publication work receives zero production credit.

Production runtime lineage remains PR #166 merge `32c32afb1365c9ae6120d810a68e5c72c4b8229a`; known-good rollback runtime remains `1.8.1-r4`.

Current environment: `we-2026-08-30-stage5a-private-session-protocol`.

Current branch: `rjr/stage5a-private-session-protocol-2026-08-30`.

Current publication checkpoint: PR #173 `Implement Stage 5A private-session candidate boundary`.

Implementation proof head before SLE packaging: `217d9d729774b23ab4fdf8c5cae842d993986a3f`, tree `21a96e44f2e606cc14cd6b54254544b456095036`.

Candidate proof: `STAGE5A_PRIVATE_SESSION_CANDIDATE_EMULATOR_PROOF_2026-08-31.md`.

Production Rules source remains unchanged `firestore.spark.rules`, reviewed/provider-proven blob `2b7c0b166ae0aae7ab7a3ce84725b21091262484`. `firestore.stage5a.rules` is isolated and is not referenced by production deployment configuration. No production Rules publication, runtime script loading or host/join UX occurred.

The candidate now fails closed unless the Firebase ID token carries a provider-verifiable `device_id` claim matching the caller's current active registered-device document. The real emulator proves missing, never-registered, revoked and mismatched device credentials cannot read or mutate a session. Production does not yet issue or prove that claim, so the candidate Rules must not be published as functional production session authority.

Closed capability authority remains consumed: exact accepted-result idempotency replay is evidence-proven, and TOKEN-LIFECYCLE SAFETY PRODUCTION-PROVEN remains protected by `tests/contracts/stage4-token-lifecycle-contracts.cjs`. Do not rerun either merely for confidence.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

First complete and independently verify PR #173 exact-head publication: all 14 permanent workflow families, reviews, inline threads, mergeability, squash merge, post-merge validation, Pages deployment, live main, unchanged public `v1.8.1 / 1.8.1-r5`, and unchanged production/provider Rules truth.

Then validate/archive WEC `we-2026-08-30-stage5a-private-session-protocol`, initialize a fresh unique WEC from observed live main with reset counters, assess it, and—if permitted—begin the next real Remote Joining slice: establish the smallest provider-verifiable current-device credential issuance, refresh and revocation boundary that can safely supply the candidate `device_id` claim. Reuse reviewed provider/auth foundations where they genuinely fit, preserve current zero-billing and IAM locks, and prove missing/stale/revoked credentials fail closed.

Do not weaken read authorization to account-only entitlement, do not pretend a browser-supplied device ID is provider-verifiable, and do not publish production session Rules in the credential-foundation slice. If no safe route exists without billing or IAM expansion, freeze the evidence-backed blocker for owner direction instead of silently broadening those locks. Minimum production session Rules review/publication, runtime loading and host/join UX remain later separate slices.

Permanent locks remain: exactly two managers; exact private capability/no listing; only three canonical localStorage keys; Candidate C sole destructive Apply authority; Firebase Spark/zero billing; Firestore memory-only; popup-only `browserSessionPersistence`; App Check enforcement remains OFF; trusted IAM unactivated/unbroadened; no public discovery/community/matchmaking/rankings; protected historical rivalry untouched.

Do not repeat consumed owner/device, reconciliation, replay, adverse-provider, token-lifecycle, structural-abuse, rate-limit, rollback, provider-Rules or provider-abuse proof merely for confidence. Do not fabricate identity/device/network/provider/session state.

---

The material below is preserved historical PR #172 transition authority and is superseded by the current override above.

# CURRENT OVERRIDE — PR #171 MERGED — RJR87 — STAGE 5A PRIVATE SESSION PROTOCOL AUTHORIZED — 2026-08-29 ET

Work Environment Continuity (WEC) and SLE = Smart Lean Efficient remain mandatory.

Status: production remains `v1.8.1 / 1.8.1-r5`, DEPLOYED / PRODUCTION-PROVEN. Live main at this checkpoint's start is `1d945ba47c89c305575ef72cc26672fc3e0743ff`, the PR #171 squash merge. Fixed RJR-1 is `87/100`. STAGE 5A IS AUTHORIZED NEXT; runtime implementation has not started in this closing evidence/SLE checkpoint.

Current environment: `we-2026-08-29-provider-abuse-production-acceptance`
Starting independently verified live main: `1d945ba47c89c305575ef72cc26672fc3e0743ff`
Current branch: `rjr/provider-abuse-acceptance-2026-08-29`
Current publication checkpoint: pending pull request
Production runtime: `v1.8.1 / 1.8.1-r5`
Production runtime lineage: PR #166 merge `32c32afb1365c9ae6120d810a68e5c72c4b8229a`
Known-good rollback runtime: `1.8.1-r4`
Production rollback proof: `PRODUCTION_PAGES_ROLLBACK_PROOF_2026-08-28.md`, workflow `33190961085` — SUCCESS / CONSUMED
Strengthened Rules provider proof: `PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md`
Production provider-abuse proof: `PRODUCTION_PROVIDER_ABUSE_ACCEPTANCE_PROOF_2026-08-29.md`
Published production Rules source: `firestore.spark.rules`
Reviewed Rules blob: `2b7c0b166ae0aae7ab7a3ce84725b21091262484`

## PR #171 publication closure

PR #171 `Record provider-proven Rules and add production abuse acceptance` merged as `1d945ba47c89c305575ef72cc26672fc3e0743ff`. Its exact final head `d5c8549924244ee177065559043e0697d0c810c3` and merge have identical tree `d8e5ef517457693ff7dd095db0777b8f366593c4`. All 14 permanent pull-request workflow families passed on that final head, final-head Codex review found no major issue, all eight inline review threads are resolved, all 14 normal post-merge push validation families passed, and Pages run `33264211554` succeeded.

Cache-bypassing retrieval independently matched deployed `index.html`, `production-authorization-acceptance.html`, `js/productionAuthorizationAcceptance.js`, and `js/productionProviderAbuseAcceptance.js` byte-for-byte to live main. Production remains `v1.8.1 / 1.8.1-r5`, and `PROBE ENUMERATION DENIAL` is live.

## Production provider-abuse acceptance and fixed RJR

At `2026-08-29T18:22:57.861Z`, one legitimate existing active Connected Account ran the deployed zero-write enumeration probe. Production returned `PASS / PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED`: the same authenticated account remained stable, the shared authentication-control lock remained held throughout the asynchronous query, one `rivalries` collection query used `limit(1)`, Firestore returned `permission-denied`, `firestoreWritesRequested` was `0`, and `localStorageUnchanged` was `true`. Both evidence-candidate flags were true.

The durable sanitized proof is `PRODUCTION_PROVIDER_ABUSE_ACCEPTANCE_PROOF_2026-08-29.md`. The account fingerprint is intentionally omitted. No account, pairing, rivalry, device, revocation, session, provider write, local save, or canonical browser storage state was created or changed.

The fixed RJR ledger advances exactly `86 -> 87`: `real-device-hardening-release` moves `8/10 -> 9/10`. Implementation, PR #171, CI, merge, Pages publication, browser authentication process, service-worker repairs, documentation, and repeated result subfields receive zero duplicate credit. `production-cloud-security` remains capped at `20/20`.

Current domain accounting: deterministic sync/recovery `20/20`; identity/auth/trust `18/20`; production cloud/security `20/20`; devices/pairing/Connected Rivalry/actual Remote Joining `20/30`; real-device hardening/release `9/10`.

The Installable Offline App remains the local-first startup and recovery baseline. The completed resilience baseline — v1.3.0 Recovery & Device Resilience Hardening — and the shipped Local Profiles / Save Library chain remain protected.

Closed capability authority remains consumed: exact accepted-result idempotency replay is evidence-proven, and TOKEN-LIFECYCLE SAFETY PRODUCTION-PROVEN remains protected by `tests/contracts/stage4-token-lifecycle-contracts.cjs`. Do not rerun either merely for confidence.

## Stage 5 lock reassessment

The qualifying production denial closes the last explicit non-state-dependent Stage 4 / production-security prerequisite named by current authority. Stages 1 through 4 are production-proven at the bounded capability level needed to start private session engineering. Authenticated third-account and revoked-device negatives remain legitimate state-dependent evidence opportunities, but nonexistent state must not be fabricated and those optional negatives do not keep Stage 5 locked.

Stage 5A is now implementation-authorized as the smallest real next slice. Keep it separate from `js/sparkConnectedRivalry.js`, whose Stage 4 no-session boundary remains protected.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

The current environment finishes and publishes only PR #172's evidence reconciliation and mandatory recursive SLE package. Require all 14 permanent workflow families plus final-head review/thread/mergeability gates on the unchanged final seal, merge/deploy under standing authorization only when clean, verify live main/Pages and unchanged production `v1.8.1 / 1.8.1-r5`, then stop before Stage 5A runtime work.

The fresh successor independently verifies the current evidence/SLE publication, fixed RJR87, production `v1.8.1 / 1.8.1-r5`, the unchanged provider Rules blob, the closing WEC, and current authority. It validates/archives predecessor WEC `we-2026-08-29-provider-abuse-production-acceptance`, initializes a fresh unique WEC from independently observed live main with reset per-environment counters, assesses it, and—if permitted—starts Stage 5A as real product work.

Stage 5A must define and contract-test the private session protocol plus deterministic host/join lifecycle in a new module, with a candidate emulator Rules boundary and no production Rules publication in that same first slice. Use the already reserved `rivalries/{rivalryId}/sessions/{sessionId}` schema and its exact fields. Require an existing active paired rivalry, one currently active registered device for each operation, exactly the two currently entitled rivalry accounts, an opaque exact-path private capability with no listing/discovery, host-only `open` creation, peer-only atomic `open -> active` join, immutable `rivalryId` / `hostAccountId` / membership authority, bounded expiry/revoke/close semantics, deterministic idempotent retry behavior, and fail-closed account/device/rivalry rechecks on every operation.

The client must remain memory-only and add no localStorage key. It must not modify local Saves, Connected Rivalry shared gameplay authority, Candidate C, Auth persistence, App Check enforcement, IAM, billing, or the protected historical rivalry. The first Stage 5A contract must cover authorized host/join, same-account and third-account denial, revoked/inactive account or device denial in emulator fixtures, expiry/replay denial, no collection listing, unchanged canonical local storage, and provider-loss fail-closed behavior. Emulator identities are test mechanisms only and receive no production RJR credit.

Current production `firestore.spark.rules` deliberately allows entitled exact session `get` and denies session `list/create/update/delete`. Do not change or publish production Rules in this closing checkpoint. After the Stage 5A protocol/client/emulator candidate is clean, separately review and publish only the minimum session-specific Rules authority it proves necessary. Root `firebase.json` and root `.firebaserc` defaults remain unchanged.

Do not repeat consumed owner/device, Candidate C destructive reconciliation, exact replay, generic adverse-provider, App Check token lifecycle, structural abuse, sustained mutation-frequency, production rollback/restoration, provider Rules publication, or this provider-abuse acceptance merely for confidence. Do not manufacture third-account, revoked-device, two-network, provider, or production session evidence.

## Permanent locks

Exactly two private managers; only the three canonical localStorage keys `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` is non-canonical. Candidate A remains non-mutating; Candidate B remains read-only; Candidate C remains the sole destructive remote-to-local Apply authority with transaction-owned rollback and strict exact raw snapshot authority.

Firebase remains Spark / zero billing; Firestore remains memory-only; Google Auth remains popup-only `browserSessionPersistence` with no extra scopes; App Check enforcement remains OFF; trusted-runtime IAM remains unactivated/unbroadened.

No public discovery/community/matchmaking/global rankings or public session listing. Protected historical rivalry `pair_a07108...756fb` remains untouched.

Standing owner merge/deploy authorization remains active after all mandatory tests, exact-head workflows, review/thread, mergeability, deployment, and live-verification gates pass. Later explicit owner instructions override it.
