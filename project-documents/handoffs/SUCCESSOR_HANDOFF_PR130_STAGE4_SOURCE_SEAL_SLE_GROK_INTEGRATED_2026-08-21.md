# FIFA 17 Career Mode Showdown — SLE Successor Handoff — PR #130 Stage 4 Source Seal + External Review Lessons

SLE = Smart Lean Efficient.

You are continuing the FIFA 17 Career Mode Showdown PWA for owner Hawk / `nikahanghojjati-oss`.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`  
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Treat this handoff as orientation only. Current source, live GitHub state, current provider state and later owner instructions always win.

This handoff incorporates only the substantial, project-compatible lessons from the independent Grok expert review supplied by the owner on 2026-08-21/22. Grok is advisory, not project authority. Where an external suggestion conflicts with live source, owner instructions, established product locks, current provider constraints or production evidence, the project authorities win.

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

At the external-review integration checkpoint, live `main` was independently observed at `df3fe061c7df3c4235aa2394623e703a4412ca46`, while PR #130 was still open/draft/mergeable with head `bcea717358d48d39e9edadfd22e0c0b73b15dca6`. A compare from the immutable source seal to that head showed eight later changes and all were documentation/continuity files only. This observation is historical evidence, not a substitute for the successor's fresh verification.

Later SLE/WEC/reviewer-document commits are documentation/continuity only and do not replace `7336adda...` as the immutable runtime/source seal. Reconfirm this by comparing the current PR head against the source seal before provider publication.

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
- Stage 5 Remote Joining sessions remain implementation-locked until Stage 4 production proof and the pre-Stage-5 reconciliation gate described below.

Remote Joining readiness remains `69/100` under `REMOTE_JOINING_READINESS.json` / `RJR-1`. Do not award points for source code, documentation, green CI, emulator proof or WEC/SLE packaging.

Do not ask the owner to repeat completed Firebase project/Web App setup, Google Auth setup, App Check setup, Stage 2 account bootstrap, Stage 3 device/pairing setup or the already-proven Stage 3 Rules publication. A new Stage 4 Rules publication is a genuinely new provider change and is the next operational boundary.

# External expert review — accepted lessons and how to use them

The owner supplied an independent Grok expert review after the Stage 4 source seal. The review strongly validated the project's core direction: exactly-two-manager private scope, local-first recovery before networking, Candidate A/B/C separation, deterministic CAS/idempotency instead of last-writer-wins, distinct identity layers, Spark/zero-billing proportionality, and the separation of Stage 4 Connected Rivalry from Stage 5 Remote Joining.

The following lessons are accepted because they materially improve correctness, release discipline or future developer focus.

## A. Strengthened Stage 4 production proof

Before calling Stage 4 production-proven, the successor should require evidence for the real provider/runtime boundary, not merely source/CI/emulator success.

Required or strongly expected Stage 4 production proof:

1. the exact reviewed `firestore.spark.rules` source at the immutable seal is the source intentionally published; re-fetch the repository blob immediately before publication;
2. after publication, verify the live Rules boundary as strongly as available tooling permits, but do not falsely claim byte-for-byte provider equality from screenshots alone;
3. both paired authenticated managers can perform the intended Connected Rivalry read/mutation path;
4. stale `baseRevision` writes are rejected rather than silently rebased;
5. exact idempotent replay does not create another mutation/revision;
6. reuse of one idempotency key for a different request remains a conflict;
7. a third account cannot access/mutate the exact rivalry;
8. a revoked writer device can no longer mutate once revocation is observed;
9. local-only gameplay/recovery remains usable if Firebase is unavailable;
10. Stage 5 session documents remain denied and no session authority is accidentally introduced;
11. canonical local Save Library bytes are not destructively replaced by the Stage 4 remote-read path;
12. RJR-1 moves only after the genuine production capability evidence is recorded.

The revoked-device production check is now treated as a high-value correctness proof rather than optional ceremony because active-device membership is part of the Stage 4 write-authorization contract.

## B. Stage 4 hardening after first production proof

Do not bloat the first provider-publication checkpoint with unrelated UX work, but after Stage 4 is production-proven, harden the following before Stage 5:

- explicit stale-revision conflict UX;
- explicit idempotent-retry/replay UX or status;
- clear local-only vs remote-authoritative observation state in the UI;
- token-expiry/adverse-network behavior;
- device revocation during active connected use;
- sleep/wake and refresh during connected operations;
- two physical devices, not only two browser storage contexts;
- preferably two different networks for at least one hardening pass.

These are Stage 4 hardening items, not excuses to reopen completed Firebase setup or add unrelated product sidequests.

## C. New named pre-Stage-5 gate: remote-to-local reconciliation design

This is the most important substantive addition from the external review.

Stage 4 intentionally avoids destructive remote-to-local Apply. That is correct for the first slice, but Stage 5 must not begin with the reconciliation problem still vague.

Before implementing Stage 5 Remote Joining session orchestration, require an explicit reviewed reconciliation contract that answers:

1. when, if ever, remote authoritative rivalry state may influence canonical local Save bytes;
2. whether the operation is projection-only, merge, replace, or a separately staged apply;
3. how exact local pre-state is snapshotted before any remote-influenced destructive mutation;
4. how anti-clobber preconditions are enforced;
5. how rollback ownership is scoped to the transaction that changed local state;
6. how failure/uncertainty leaves the local Save recoverable;
7. how stale remote state is prevented from overwriting a newer local state;
8. how the user can distinguish observed remote state from locally committed canonical state.

Preferred direction: reuse Candidate C's proven transactional ideas and recovery guarantees rather than creating a parallel destructive mutation authority. This does not mean blindly routing remote sync through Candidate C's import UX. It means preserving the same properties: explicit intent, exact pre-state, deterministic preconditions, transaction ownership, verification, rollback and anti-clobber.

Candidate C remains the sole existing destructive local Apply authority until a later architecture is explicitly reviewed and authorized. Do not invent a second destructive path casually.

## D. Stage 5 design constraints carried forward

When Stage 5 eventually unlocks, keep it narrower than a multiplayer platform:

- explicit host/join only for the already-paired two managers;
- session state separate from rivalry state;
- minimal presence, preferably ephemeral where practical;
- clear reconnect and stale-session recovery;
- local-first fallback when remote service is unavailable;
- no public discovery, matchmaking, lobby, invitation directory, community layer, leaderboard or ranking;
- display names never authorize;
- no broadening to Blaze/Cloud Run/Functions/Storage merely because Remote Joining exists.

Stage 4 and Stage 5 must remain distinct. Do not collapse shared authoritative rivalry state and session orchestration into one milestone.

## E. Stable connected-release evidence matrix

Before claiming a stable Remote Joining release, expand real-device and browser evidence beyond the current Chromebook-centric proof.

At minimum include:

- two physical devices;
- different networks;
- sleep/wake;
- page refresh during or around mutation;
- token/session expiry;
- account disable;
- device revocation;
- PWA update while connected;
- recovery to the previous whole-shell runtime;
- no canonical local-save loss after adverse paths;
- Firefox and Safari coverage before a broad stable Remote Joining claim, even if Chromium remains the primary owner device/browser.

Do not require this whole matrix before the first Stage 4 production slice. It belongs to Stage 4 hardening / pre-stable-Remote-Joining release quality.

## F. Security proportionality and architecture threshold

The external review supports the existing proportional-security direction.

Continue direct Firestore Security Rules for Stage 4 on Spark. Do not activate the dormant trusted backend merely because it was historically designed.

However, the project has now already encountered the Firestore 1,000-expression evaluation ceiling once. Treat future repeated rule-limit pressure or rules that become difficult to reason about/test as a real architecture threshold. If a later remote/session mutation boundary requires contorted rules or produces subtle authorization ambiguity, reassess whether a trusted backend is then justified. Do not cross that threshold preemptively.

App Check enforcement remains OFF. Only reconsider enforcement with a concrete threat/abuse case plus measured Chromebook/mobile reliability evidence. App Check remains attestation, never user authentication or authorization.

## G. Process simplification without losing evidence

The review correctly identifies continuity/documentation overhead as a project risk.

Apply this lesson SLE-style:

1. do not create new handoff/authority files merely to restate existing truth;
2. prefer updating the current canonical successor handoff over spawning a parallel review-authority lineage;
3. `SESSION_BOOTSTRAP.json` already serves much of the proposed machine-readable current-state role; improve/reuse it rather than creating another state system;
4. successors must still independently verify live main, live site/runtime, PR head and RJR authority;
5. source/production evidence remains necessary; simplification must not erase proof;
6. do not add a new permanent workflow family for this external review;
7. consolidate workflow families only when redundancy is demonstrated, not to chase a smaller number;
8. do not pause Stage 4 provider proof for a documentation refactor sidequest;
9. stale historical files may remain provenance, but they must not become live authority when current bootstrap/override files supersede them.

The right goal is less ambiguity and less duplicate current-state prose, not weaker engineering discipline.

## H. Explicitly not adopted as new project work

The external review does not justify:

- a framework rewrite;
- React/Vue/Svelte migration;
- a new router beside `js/screens.js`;
- a new persistence authority beside `js/storage.js`;
- enabling App Check enforcement now;
- enabling Blaze billing now;
- activating Cloud Run/Cloud Functions/Storage now;
- public discovery or social features;
- replacing CAS with last-writer-wins;
- weakening Candidate C/local recovery;
- adding Firefox/Safari as a blocker for the first Stage 4 production publication;
- adding new process layers merely to document the review.

# IMMEDIATE NEXT TASK AFTER FULL STUDY

Complete the Stage 4 provider-publication and production-proof checkpoint, not Stage 5.

After live-first verification and a fresh successor WEC permits work:

1. verify PR #130 still contains the sealed runtime/source boundary and that all commits after `7336adda...` are continuity/documentation only;
2. verify all current required tests, review/thread and mergeability gates remain satisfied;
3. re-fetch the exact sealed `firestore.spark.rules` source/blob immediately before provider publication;
4. publish that reviewed Stage 4 Rules candidate to production Firestore Rules only when the current provider gate is valid;
5. record provider publication proof precisely without claiming screenshot byte equality;
6. use the standing owner merge/deploy authorization only after all required tests and current provider/deployment gates pass;
7. merge/deploy the Stage 4 app in the safe order supported by current live state and standing policy;
8. obtain genuine live Connected Rivalry production evidence across both paired accounts and registered-device authority;
9. include revoked-device denial, stale-CAS behavior, exact replay behavior, third-account denial and local-only fallback in the production/prod-equivalent evidence plan where practical;
10. update RJR-1 only for fixed-domain production capability evidence actually demonstrated;
11. after Stage 4 first proof, complete focused Stage 4 hardening including two physical devices and explicit conflict/replay/local-vs-remote UX;
12. before Stage 5 begins, complete and review the remote-to-local reconciliation contract described above;
13. keep Stage 5 session orchestration blocked until Stage 4 is production-proven and the reconciliation gate is satisfied.

Standing owner merge/deploy authorization remains effective through project completion, but only after all required tests and required gates pass. It never authorizes bypassing a failed source, provider, deployment, recovery or production-proof gate.

# Mandatory owner-facing response footer

Every substantive project response must end with these seven lines in this exact order:

`Handoff proximity: X%`  
`Remote Joining readiness: X/100`  
`Current lane: ...`  
`Concrete dependency completed: ...`  
`Next unlock: ...`  
`Blocker: ...`  
`Sidequest check: ...`

At `Handoff proximity: 100%`, complete mandatory SLE packaging and stop before the next substantial milestone. Never fabricate usage.
