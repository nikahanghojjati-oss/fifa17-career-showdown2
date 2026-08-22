# FIFA 17 Career Mode Showdown — SLE Successor Handoff — PR #130 Stage 4 Source Seal

SLE = Smart Lean Efficient.

You are continuing the FIFA 17 Career Mode Showdown PWA for owner Hawk / `nikahanghojjati-oss`.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Treat this handoff as orientation only. Current source, live GitHub state, current provider state and later owner instructions always win.

## Mandatory live-first bootstrap

Before any provider or repository mutation, independently fetch live `main`, PR #130, its exact head, changed files, all workflow results, submitted reviews, inline review threads and mergeability. Verify the deployed site's current runtime and the current Firebase production Rules boundary relevant to Stage 4.

Read first:

1. `SESSION_BOOTSTRAP.json`
2. `CURRENT_STAGE4_SOURCE_SEAL_OVERRIDE_2026-08-21.md`
3. `00_SLE_HANDOFF_PROTOCOL.md`
4. `REMOTE_JOINING_READINESS.json`
5. `WORK_ENVIRONMENT_STATUS.json`
6. this handoff
7. `RELEASE_V1.7.0.md`
8. `00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md`
9. `PRODUCTION_STAGE3_PRIVATE_PAIRING_PROOF_2026-08-21.md`

The predecessor environment is `we-2026-08-21-v170-connected-rivalry`. Its closing decision is `PREPARE_HANDOFF` and belongs only to that closing environment. Do not inherit it as the successor's own decision. Validate/archive predecessor facts, create a fresh environment ID with reset counters and live starting-main truth, then run the successor's own WEC assessment before substantial work.

## Production and candidate truth

Production-proven application/runtime remains `v1.6.0 / 1.6.0-r1`, Stage 3 Registered Devices / Private Pairing.

Stage 4 candidate is `v1.7.0 / 1.7.0-r1`, NOT production-proven.

PR #130:

- title: `v1.7.0 Stage 4: Connected Rivalry`
- branch: `agent/v1.7.0-connected-rivalry-state`
- source-seal base main: `df3fe061c7df3c4235aa2394623e703a4412ca46`
- immutable validated source seal: `7336adda832322bbd93e8c16f3de0e4bbf5273c1`
- all 14 permanent workflow families: green on that exact unchanged source seal
- submitted reviews: zero
- inline review threads: zero
- mergeable at source seal: true
- reviewed Stage 4 `firestore.spark.rules` blob: `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`

Later SLE/WEC packaging commits are documentation/continuity only and do not replace `7336adda...` as the immutable runtime/source seal. Reconfirm this by comparing the current PR head against the source seal before provider publication.

## What Stage 4 source now implements

The bounded first Connected Rivalry slice provides:

1. exact private rivalry attachment with direct exact-ID access and no rivalry listing/discovery;
2. IndexedDB rivalry pointer as convenience metadata only, never gameplay/save/authorization authority;
3. deterministic projection of the explicitly connected local Save;
4. direct authoritative shared-state reads that do not overwrite canonical local Save Library bytes;
5. immutable client `baseRevision` compare-and-swap with monotonic revisions and prior-content-hash linkage;
6. atomic SHA-256 idempotency receipts cross-linked to authoritative state;
7. exact replay without mutation or revision increment;
8. reused-key conflict for a different request fingerprint;
9. stale-base conflict with no silent rebase or last-writer-wins fallback;
10. mutation authority limited to the active two-account paired rivalry, both required accounts active, and an active registered writer device;
11. third-account denial, required-account disable freeze and device-revocation freeze;
12. tombstone anti-resurrection;
13. continued Stage 5 session-write denial.

This first Stage 4 slice intentionally does not destructively Apply remote payload bytes into the canonical local Save Library. Candidate C remains the sole destructive local Apply authority.

## Firestore Rules hardening at the seal

The first emulator run exposed a legitimate missing-idempotency-receipt probe being denied. Rules were corrected so an entitled manager may probe an exact valid 256-bit receipt hash when the receipt does not yet exist; an existing receipt remains readable only by its creating actor.

A later emulator run exposed Firestore's 1,000-expression Rules evaluation ceiling during the atomic shared-state plus receipt write. The final bounded refactor removed redundant repeated account/device/pairing evaluation without removing the security invariants. It also strengthened freshness: the state side requires the referenced idempotency receipt not to exist before the transaction, so an old receipt cannot be reused as fresh mutation evidence.

The Stage 3 + Stage 4 workflow passed after that refactor, including Stage 3 regression tests, Stage 4 deterministic client contracts and the complete Stage 4 Firestore emulator matrix.

## Permanent security and product locks

- exactly two managers;
- same-league/different-permanent-club gameplay rules unchanged;
- canonical localStorage exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`;
- `activeShowdown` remains non-canonical;
- device identity and Connected Rivalry pointer may live in IndexedDB but are not gameplay/save authority;
- Candidate A non-mutating export;
- Candidate B read-only import analysis;
- Candidate C sole destructive import Apply authority;
- Google Auth popup-only with `browserSessionPersistence` and no extra OAuth scopes;
- Firestore persistent cache remains disabled/memory-only;
- App Check enforcement remains OFF;
- Firebase Spark / zero billing only;
- no Blaze, Cloud Run, Cloud Functions or Firebase Storage;
- historical Stage 2H trusted runtime/IAM remains unactivated and must not be broadened;
- no public discovery, community, matchmaking, public invitation directory or global leaderboard/rankings;
- display names never authorize;
- Stage 5 Remote Joining sessions remain implementation-locked until Stage 4 production proof.

Remote Joining readiness remains `69/100` under `REMOTE_JOINING_READINESS.json` / `RJR-1`. Do not award points for source code, documentation, green CI, emulator proof or WEC/SLE packaging.

Do not ask the owner to repeat completed Firebase project/Web App setup, Google Auth setup, App Check setup, Stage 2 account bootstrap, Stage 3 device/pairing setup or the already-proven Stage 3 Rules publication. A new Stage 4 Rules publication is a genuinely new provider change and is the next operational boundary.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Complete the Stage 4 provider-publication and production-proof checkpoint, not Stage 5.

After live-first verification and a fresh successor WEC permits work:

1. verify PR #130 still contains the sealed runtime/source boundary and that later commits after `7336adda...` are continuity/documentation only;
2. verify all current required tests, review/thread and mergeability gates remain satisfied;
3. publish the exact reviewed Stage 4 `firestore.spark.rules` candidate to production Firestore Rules only when the current provider gate is valid;
4. record provider publication proof precisely without claiming screenshot byte equality;
5. use the standing owner merge/deploy authorization only after all required tests and current provider/deployment gates pass;
6. merge/deploy the Stage 4 app in the safe order supported by current live state and standing policy;
7. obtain genuine live Connected Rivalry production evidence across the paired accounts/registered device boundary;
8. update RJR-1 only for fixed-domain production capability evidence actually demonstrated;
9. keep Stage 5 session orchestration blocked until Stage 4 is production-proven.

Standing owner merge/deploy authorization remains effective through project completion, but only after all required tests and required gates pass. It never authorizes bypassing a failed source, provider, deployment, recovery or production-proof gate.

## Mandatory owner-facing response footer

Every substantive project response must end with these seven lines in this exact order:

`Handoff proximity: X%`
`Remote Joining readiness: X/100`
`Current lane: ...`
`Concrete dependency completed: ...`
`Next unlock: ...`
`Blocker: ...`
`Sidequest check: ...`

At `Handoff proximity: 100%`, complete mandatory SLE packaging and stop before the next substantial milestone. Never fabricate usage.
