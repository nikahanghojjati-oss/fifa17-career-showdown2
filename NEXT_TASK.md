# CURRENT OVERRIDE — v1.8.1-r5 SUSTAINED MUTATION-FREQUENCY HARDENING — RJR84 — PR #163 PUBLICATION — 2026-08-27 ET

Status: production `v1.8.1 / 1.8.1-r4` remains DEPLOYED / PRODUCTION-PROVEN while candidate `v1.8.1 / 1.8.1-r5` is EVIDENCE-PROVEN / PUBLICATION PENDING. Fixed RJR-1 is `84/100`. STAGE 5 REMAINS LOCKED.

Current environment: `we-2026-08-27-post-pr162-rjr-successor-1544`.
Starting independently verified live main: `567e2c308ce32cf2c4ef7432e65ffb3a99111ef5` (PR #162 squash merge).
Current pull request: #163 `Harden sustained Connected Rivalry mutation frequency`, branch `agent/post-pr162-rjr-successor`.

## Proven capability

PR #163 proof head `e26d37dc598c956e8e7a82e1f9c0b3d919326914` passed the permanent Validate Stage 3 Private Pairing lane including `tests/contracts/stage4-mutation-rate-limit-contracts.cjs` and `tests/firebase/stage4-mutation-rate-limit-emulator.cjs`.

The permanent proof establishes one distinct broader abuse-resistance capability: after the bounded low-revision establishment path anchors authoritative shared-state time to Firestore server time, sustained distinct revisions require at least two seconds between accepted revisions. A skewed caller clock cannot bypass the boundary. A denied mutation allocates no authoritative revision or idempotency receipt and leaves canonical local Save Library state unchanged. Exact accepted-result replay remains idempotent during the closed window, and the same previously denied logical mutation may advance exactly once after the window opens under the normal immutable-base CAS contract.

This earns exactly +1 in the fixed `real-device-hardening-release` domain: RJR 83 → 84. Runtime packaging, CI volume, PR publication, merge, deployment, provider publication and documentation earn zero duplicate readiness credit.

## Current publication candidate

Authorized release candidate: `v1.8.1 / 1.8.1-r5`.
Candidate application/runtime: `v1.8.1 / 1.8.1-r5`.
Previous known-good whole-shell recovery runtime: `1.8.1-r4`.
Release record: `RELEASE_V1.8.1_R5.md`.

r5 exposes Firestore `serverTimestamp()` only through the existing bounded browser Firestore SDK surface and uses it for authoritative Connected Rivalry shared-state `updatedAt`. Idempotency retention remains seven days and existing receipt timestamp semantics remain unchanged. No new Firebase service, billing, Auth scope or trusted runtime is activated.

PR #162 structural abuse resistance remains closed and protected. Exact accepted-result replay, deterministic adverse-provider failure safety, App Check token-lifecycle safety, production remote-to-local reconciliation and the prior two-device production evidence remain consumed proof and must not be repeated merely for confidence.

Production-provider publication of the strengthened candidate `firestore.spark.rules` from PR #162/#163 remains separately unverified. Do not describe those candidate Rules as production-live until provider evidence exists.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish PR #163 publication only:

1. Require one unchanged exact r5 candidate head with all 14 permanent workflow families green, including the permanent Stage 3/4 Firestore emulator lane and Stability Chromium journey.
2. Inspect submitted reviews and inline threads, repair legitimate findings without weakening proof, and resolve only after the underlying issue is fixed.
3. Confirm PR #163 is non-draft and mergeable.
4. Expected-head squash merge under standing owner authorization.
5. Independently verify resulting live `main`, post-merge workflow/deployment state, deployed `v1.8.1 / 1.8.1-r5` byte equality and normal deployed Stability/App Check journey.
6. Keep production Firestore Rules publication as a separate provider-verification boundary; deployment of website bytes does not prove Rules publication.
7. Then complete this environment's recursive SLE handoff package and seal its WEC at Handoff proximity 100%. Do not begin the next substantial RJR capability after the seal.

## Remaining explicitly uncredited capability

Authenticated third-account/revoked registered-device production negatives remain uncredited without legitimate authenticated production identity/device state. Two-physical-network behavior remains separately uncredited. Remote Joining specific real-device token-lifecycle acceptance remains uncredited. Production abuse acceptance remains uncredited. Production rollback proof remains uncredited. Actual Remote Joining sessions remain Stage-5-gated. Final stable Remote Joining release acceptance remains uncredited.

Stage 5 host/join/session orchestration remains locked until its explicit preconditions genuinely close.

## Do not repeat

Do not repeat completed r3 recovery, fresh pairing/device proof, unavailable-code proof, stale-preview proof, destructive Candidate C reconciliation, exact replay, deterministic adverse-provider safety, deterministic token-lifecycle proof, structural abuse proof or the newly proven sustained mutation-frequency emulator capability merely for volume.
Do not force, edit or delete historical `pair_a07108...756fb`.

## Permanent locks

The Installable Offline App remains the local-first startup and recovery baseline; ordinary local startup must not depend on Firebase availability. The `v1.3.0 Recovery & Device Resilience Hardening` baseline remains closed and protected, and Local Profiles with Save Library remain the shipped local identity/save dependency chain.

Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; activeShowdown is non-canonical. Candidate A remains non-mutating export, Candidate B remains read-only analysis, and Candidate C remains the sole destructive Apply authority for remote-to-local local mutation. Candidate C rollback remains transaction-owned and its destructive recovery boundary requires a strict exact raw snapshot.

Firebase remains Spark / zero billing. Firestore remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. App Check enforcement remains OFF. Trusted-runtime IAM remains unactivated/unbroadened. Exactly two private managers remain required. Public discovery, community, matchmaking and global rankings remain prohibited.

## Work Environment Continuity

The active successor WEC is `we-2026-08-27-post-pr162-rjr-successor-1544`; it did not inherit the predecessor `HANDOFF_NOW` decision. Handoff proximity is environment-local transition readiness, not RJR and not project completion. At Handoff proximity 100%, generate the complete mirrored recursive SLE package, refresh all bootstrap/context pointers, run the next-prompt contract, seal the WEC as the final branch mutation, and stop before the next substantial milestone.

Standing owner authorization remains active: after all required tests and publication gates pass, merge and deploy without repeatedly asking for approval. A later explicit owner instruction overrides it.
