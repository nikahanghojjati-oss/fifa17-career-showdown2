# CURRENT OVERRIDE — PR #173 / STAGE 5A CANDIDATE EMULATOR-PROVEN / RJR87 — 2026-08-31 UTC

This section supersedes lower historical project-state text.

Status: DEPLOYED / PRODUCTION-PROVEN runtime remains `v1.8.1 / 1.8.1-r5`. Stage 5A source is now candidate/emulator-proven in PR #173 without production Rules publication, runtime loading or host/join UX. Fixed RJR-1 remains `87/100`.

Starting main: PR #172 squash `4c12d68dacc0112c7c0fe70d4f1a25e3df7de5de`.

Implementation proof head before SLE packaging: `217d9d729774b23ab4fdf8c5cae842d993986a3f`, tree `21a96e44f2e606cc14cd6b54254544b456095036`.

Implemented: separate `js/sparkPrivateSession.js`; isolated `firestore.stage5a.rules`; deterministic client contract; real Firebase emulator matrix; workflow and complete-suite integration.

Proven candidate boundary: exact 256-bit capability, no listing, provider-verifiable `device_id` token claim matched to the current active registered device, active account/exactly-two-account rivalry rechecks, host/open, peer/join, immutable authority, bounded expiry/revoke/close, deterministic replay, terminal no-resurrection, missing/unknown/revoked/mismatched-device denial, inactive/lost-entitlement denial and provider-loss storage safety.

Unchanged production boundary: `firestore.spark.rules` blob `2b7c0b166ae0aae7ab7a3ce84725b21091262484`; deployment config; application/runtime; service worker; Auth persistence; App Check enforcement OFF; IAM; billing; canonical storage; Candidate C; protected historical rivalry.

Unproven production dependency: current production Auth does not issue the candidate `device_id` claim. The candidate therefore remains safely unusable in production. After PR #173 publication, a fresh WEC must establish and prove the smallest provider-verifiable current-device credential issuance/refresh/revocation boundary without silently expanding billing or trusted IAM. Minimum production session Rules publication, runtime/UX activation and RJR movement remain later.

Current proof: `STAGE5A_PRIVATE_SESSION_CANDIDATE_EMULATOR_PROOF_2026-08-31.md`.

Current starter: `START_NEXT_SESSION_V1.4.31_PR173_STAGE5A_CANDIDATE_PROVEN.md`.

Current deep SLE: `SUCCESSOR_HANDOFF_PR173_STAGE5A_CANDIDATE_PROVEN_SLE_2026-08-31.md`.

---

The material below is preserved historical PR #172 transition authority and is superseded by the current override above.

# CURRENT OVERRIDE — PR #171 MERGED / PRODUCTION PROVIDER-ABUSE PASS / RJR87 / STAGE 5A AUTHORIZED — 2026-08-29 ET

Status: DEPLOYED / PRODUCTION-PROVEN; normal production remains `v1.8.1 / 1.8.1-r5`. Current verified live main at this checkpoint's start is `1d945ba47c89c305575ef72cc26672fc3e0743ff`, the PR #171 squash merge. Fixed RJR-1 is `87/100` after a legitimate owner-authenticated production Firestore enumeration denial. Stage 5A private session protocol/emulator work is authorized next; no Stage 5 runtime or production session Rules mutation is included in this closing checkpoint.

Application: `v1.8.1`
Production runtime: `1.8.1-r5`
PR #171 exact final head: `d5c8549924244ee177065559043e0697d0c810c3`
PR #171 squash merge / starting live main: `1d945ba47c89c305575ef72cc26672fc3e0743ff`
Identical PR/merge tree: `d8e5ef517457693ff7dd095db0777b8f366593c4`
Post-merge Pages run: `33264211554` — SUCCESS
Production runtime lineage: PR #166 merge `32c32afb1365c9ae6120d810a68e5c72c4b8229a`
Immediate known-good rollback runtime: `1.8.1-r4`
Rollback proof workflow: `33190961085` — SUCCESS / consumed
Provider Rules proof: `PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md`
Production provider-abuse proof: `PRODUCTION_PROVIDER_ABUSE_ACCEPTANCE_PROOF_2026-08-29.md`
Published reviewed Rules source: `firestore.spark.rules`
Reviewed Rules blob: `2b7c0b166ae0aae7ab7a3ce84725b21091262484`
Remote Joining readiness: `87/100` under fixed RJR-1
Closing environment: `we-2026-08-29-provider-abuse-production-acceptance`

## Current production truth

PR #171 is merged and fully published. All 14 permanent workflow families passed on its exact final head, final-head Codex review found no major issue, all eight inline threads are resolved, all 14 normal post-merge push validation families passed, and Pages run `33264211554` succeeded. Cache-bypassing public retrieval matched the deployed acceptance document and its two acceptance-only modules byte-for-byte to live main. Production remains `v1.8.1 / 1.8.1-r5`.

The strengthened production Firestore Rules remain provider-proven in project `fifa17-career-showdown-prod`, Database `(default)`, from repository blob `2b7c0b166ae0aae7ab7a3ce84725b21091262484`. Root `firebase.json` remains intentionally on `firestore.rules`; root `.firebaserc` remains intentionally defaulted to `demo-career-mode-showdown-phase1f`; isolated production Rules deployment remains `firebase.production.rules.json` plus `firestore.spark.rules`.

The Installable Offline App remains the local-first startup and recovery baseline. The completed resilience baseline — v1.3.0 Recovery & Device Resilience Hardening — and the shipped Local Profiles / Save Library chain remain protected. App Check enforcement remains OFF, trusted-runtime IAM remains unactivated/unbroadened, billing remains Spark / zero, Firestore client persistence remains memory-only, and Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

## Production provider-abuse acceptance

At `2026-08-29T18:22:57.861Z`, a legitimate existing active Connected Account ran deployed `PROBE ENUMERATION DENIAL`. Production returned `PASS / PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED`. The same account remained authenticated, the shared authentication-control lock stayed held across the asynchronous `limit(1)` rivalry collection query, Firestore returned `permission-denied`, zero writes were requested, and localStorage remained unchanged.

No account, registered device, pairing, rivalry, shared gameplay state, session, revocation, local Save, or provider write was created or mutated. No rivalry ID or rivalry payload was emitted. The SHA-256 account fingerprint was present in the browser output and is deliberately omitted from the durable proof.

## RJR truth

Fixed RJR-1 is `87/100`. Exactly one capability is credited from the production PASS: `real-device-hardening-release` moves `8/10 -> 9/10`, total `86 -> 87`. Probe implementation, PR/CI/deployment, the sign-in process, documentation, and individual subfields receive zero duplicate credit. `production-cloud-security` remains capped at `20/20`.

Current domain accounting: deterministic sync/recovery `20/20`; identity/auth/trust `18/20`; production cloud/security `20/20`; devices/pairing/Connected Rivalry/actual Remote Joining `20/30`; real-device hardening/release `9/10`.

Thirteen genuine points remain. Still uncredited are legitimate state-dependent third-account/revoked-device production negatives, actual Stage 5 Remote Joining sessions, two-device/two-network host/join behavior, Remote Joining-specific token/reconnect/adverse-network hardening, remaining identity/session authorization proof, and final stable release acceptance. State-dependent negatives must not be fabricated.

## Stage 5 activation boundary

The production enumeration denial closes the last explicit non-state-dependent Stage 4 / production-security prerequisite in current authority. Stage 5 is no longer locked. The next authorized product slice is Stage 5A: a separate private session protocol/client module plus deterministic emulator contracts and candidate minimum session Rules.

The reserved session path is `rivalries/{rivalryId}/sessions/{sessionId}`. Its established data fields remain `rivalryId`, `hostAccountId`, `memberAccountIds`, `state`, `createdAt`, `expiresAt`, `lastActivityAt`, and `revokedAt`; lifecycle states remain `open | active | revoked | expired | closed`. Every operation must recheck active account, active registered device, and current rivalry entitlement.

Current production `firestore.spark.rules` allows entitled exact session `get` only when the caller is already in `memberAccountIds`, and denies session `list/create/update/delete`. The closing RJR87 checkpoint does not change those Rules. Stage 5A must establish the exact host/join protocol and emulator proof first; minimum production session authority is a later separately reviewed publication.

Stage 5A stays out of `js/sparkConnectedRivalry.js` so the protected Stage 4 no-session contract remains true. It may add no localStorage key, public discovery, public lobby, public matchmaking, public profile, community feature, or ranking. It may not mutate Connected Rivalry gameplay authority or local Saves.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

The fresh successor verifies the RJR87 evidence/SLE publication and live production state, validates/archives closing WEC `we-2026-08-29-provider-abuse-production-acceptance`, initializes and assesses a fresh unique WEC, then—if permitted—begins the exact Stage 5A private session protocol/emulator slice defined in `NEXT_TASK.md`.

Do not repeat consumed owner/device, Candidate C reconciliation, exact replay, adverse-provider, token-lifecycle, structural-abuse, sustained-rate-limit, production rollback/restoration, provider Rules publication, or production provider-abuse proof. Do not manufacture missing identity/device/network/provider/session evidence.

## Permanent locks

Exactly two private managers. Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical. Candidate A remains non-mutating export, Candidate B read-only analysis, Candidate C sole destructive remote-to-local Apply authority with strict exact raw snapshot and transaction-owned rollback.

Firebase remains Spark / zero billing. Firestore remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. App Check enforcement remains OFF. Trusted-runtime IAM remains unactivated/unbroadened. Public discovery/community/matchmaking/global rankings/session listing remain prohibited. Historical rivalry `pair_a07108...756fb` must not be forced, edited, or deleted.

Work Environment Continuity and SLE = Smart Lean Efficient remain mandatory. Usage is unavailable and must not be fabricated. Standing owner merge/deploy authorization remains active after all required gates pass; later explicit owner instructions override it.
