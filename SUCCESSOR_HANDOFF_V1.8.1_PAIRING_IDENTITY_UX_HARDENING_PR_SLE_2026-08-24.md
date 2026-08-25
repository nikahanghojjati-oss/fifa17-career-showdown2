# FIFA 17 Career Mode Showdown — SLE Successor Handoff — v1.8.1 Pairing Identity UX Hardening PR

Recorded: 2026-08-24 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
SLE = Smart Lean Efficient.

## 1. Mission and current truth

Finish the exact-head review, merge and deployed verification of the bounded `v1.8.1 / 1.8.1-r1` private-pairing identity/guidance patch. The current source candidate is not production-proven. Production and immediate whole-shell recovery remain `v1.8.0 / 1.8.0-r1` until the patch is merged, deployed and byte-verified.

Live `main` at PR creation was `87c57b3f918520b93feeefc189802dc65aa96257`. PR #138 opened from initial exact head `7a2902aaef1e2e8307edb7822d4203305fb6e75b`, parented directly to that main, with exact local/GitHub tree `9ba73c65dcc8db715fa46d5dec5e9c6f120f0658`. All 39 uploaded blobs matched their local Git hashes. Automated review then identified a stale successor entrypoint; the PR head must advance for this mirrored package, so fetch the exact current head and never merge by the initial SHA.

## 2. Genuine owner evidence and RJR authority

Owner-controlled Chromebook and iPhone evidence proves a fresh private pairing across two physical devices, exact Player One and Player Two account/profile/Save entitlements, revision-0 publication, a live stale-write rejection, safe refresh recovery, revision-1 publication and cross-device convergence. No local Apply was performed and no local Save overwrite was reported.

This is genuine fixed-domain real-device-hardening evidence. `REMOTE_JOINING_READINESS.json` therefore moves RJR-1 from 77 to exactly `78/100`. Source implementation, tests, CI, deployment, WEC, SLE and documentation earn zero RJR points. Exact replay, third-account/revoked-device production negatives, adverse-network/token lifecycle hardening, destructive reconciliation proof and actual Stage 5 sessions remain uncredited.

## 3. Defect and bounded implementation

The owner evidence exposed two related UX problems in `js/sparkPrivatePairing.js`:

1. `renderPanel()` rebuilt manager options from positional indexes and did not restore the chosen identity, so a Player Two operation could visually return the selector to Player One.
2. A consumed, expired or unreadable one-use capability could surface raw Firestore `Missing or insufficient permissions` text and then leave the user uncertain whether pairing succeeded.

The candidate introduces a stable selection key derived from role, `profileId` and `saveId`; stores it across async create/join work and every rerender; updates selection without rebuilding the form; and clears only at account/sign-out boundaries. Pasted capability input survives selector-only changes. Permission-denied, consumed, expired and otherwise unavailable capability outcomes map to one privacy-safe non-enumerating explanation with a fresh-code path and guidance to use Connected Rivalry when already paired. Successful pairing points to the existing Connected Rivalry actions. Stage 5 remains locked.

The dormant multi-save portability browser audit was corrected to use the real Save Library cutover and a complete renderable archived fixture. This is test-only and changes no product authority.

## 4. Validation evidence

Before PR creation, the exact local candidate passed:

- all 69 contract suites, including release authority, WEC, SLE and fixed RJR coherence;
- the rendered mobile Stage 3 audit proving pasted-code retention, exact Player Two retention after success and Player Two plus safe guidance after simulated permission denial;
- desktop/mobile IndexedDB manager identity, Connected Account late-runtime and Stage 4 reconciliation audits;
- Stability with 72 checkpoints and 36 accessibility scans;
- runtime-error, settings-focus, Save Library, manager-identity, analytics, home/loading and all licensed-football visual audits;
- Candidate A backup, Candidate B analysis, Candidate C restore/rollback, multi-save portability, offline boundary and offline cache lifecycle v2;
- post-commit static release, release-authority, SLE, RJR and Stage 3 contracts on a clean tree.

On initial PR head `7a2902aa…`, 13 of 14 workflow families reported success and the final Stage 3 job showed every step successful while GitHub completion propagation was pending. Do not inherit that partial summary. This SLE correction changes the head and requires a fresh complete exact-head gate.

The automated Codex review correctly found that `project-documents/START_NEXT_SESSION.md` and `SESSION_BOOTSTRAP.json` still routed a successor to the superseded v1.8.0/RJR-77 pointer-repair task. The v1.4.12 starter, this complete handoff, byte-identical mirrors, refreshed capsule/current entrypoint and a permanent packaging assertion are the required bounded fix. Resolve the review thread only after the final patch is published and verified.

## 5. Permanent locked boundary

- Firestore Rules remain exact production blob `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`; do not republish unchanged Rules.
- Firebase Spark / zero billing; no Functions or Storage initialization.
- App Check enforcement remains OFF. Firestore remains memory-only.
- Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.
- Exactly two stable private manager identities and direct private rivalry access only; no public discovery, community, matchmaking, rankings or global leaderboard.
- Canonical browser storage is exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`; `activeShowdown` and Connected Rivalry pointers are non-canonical.
- Candidate A is non-mutating export, Candidate B is read-only analysis, and Candidate C is the sole destructive local Apply authority.
- Candidate C retains immutable exact remote/local intent, canonical backup before mutation, strict exact raw snapshots, transaction-owned mutation, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification.
- Stage 2H IAM remains reviewed, unactivated and unbroadened. Stage 5 host/join documents, presence, lobbies and sessions remain implementation-locked.

## 6. IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Fetch live `main`, PR #138, its exact branch head, changed filenames, workflow runs/jobs, submitted reviews, inline threads and mergeability. Verify the branch still contains only the bounded v1.8.1 product patch, evidence/authority updates and this necessary successor correction.
2. Validate root/project starter and handoff mirrors byte-for-byte. Confirm `project-documents/START_NEXT_SESSION.md` and `SESSION_BOOTSTRAP.json` point to v1.4.12, this v1.8.1 lane and RJR 78—not the historical v1.8.0 pointer repair.
3. Run the complete applicable local contract and rendered-browser gates on the final tree. Publish no further mutation after the final WEC seal.
4. Require all 14 permanent PR workflow families to succeed on the exact unchanged head. Inspect exact failed job logs before changing anything; never infer a source defect from a workflow family name.
5. Require clean mergeability and zero unresolved review threads. Resolve the current continuity thread only after the published final head proves this package and assertion.
6. Merge under standing owner authorization with the exact head SHA as the expected-head guard. If the head moved or any gate is incomplete, stop rather than force.
7. Verify the resulting `main`, Pages deployment and public shell serve exact `v1.8.1 / 1.8.1-r1` artifacts. Preserve `v1.8.0-r1` as immediate whole-shell recovery until that verification succeeds.
8. Seal a post-deployment SLE package before beginning a distinct milestone. The smallest subsequent owner check is non-destructive Player Two selection plus one new/invalid capability outcome; it must retain Player Two and show safe guidance.
9. After the patch is proven, resume the separate Stage 4 reconciliation owner proof: non-mutating Preview, stale-intent rejection, canonical backup and exact Candidate C Apply with identity/unrelated-Save preservation and proof that local Apply does not mutate remote authority. Do not begin Stage 5 in the same milestone.

## 7. WEC, publication authority and recovery

Current environment: `we-2026-08-24-v181-pairing-ux-hardening`, active/`HANDOFF_AT_CHECKPOINT` after the package-correction assessment. Finish only the already-bounded PR #138 final-head validation, expected-head merge and deployment verification operation. Usage remains unavailable and must not be estimated. After deployment, append final facts safely, complete the post-deployment SLE package and transition before another substantial milestone.

Standing owner authorization permits merge and deploy only after all required tests and gates pass. Use exact expected-head protection and do not request repeated approval. If promotion fails before deployment verification, keep/recover the complete shell at `v1.8.0 / 1.8.0-r1`; never construct a mixed-version rollback.

## 8. Mandatory reporting and recursive SLE rule

Every substantive owner-facing development response must end exactly:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...

At Handoff proximity 100%, or any WEC handoff decision, create the complete Smart Lean Efficient package: versioned compact starter, complete root handoff, byte-identical project mirrors, refreshed capsule/context pointers, exact live/PR/deployment/RJR evidence, explicit next task and a final WEC seal as the last branch mutation. Then stop before another substantial milestone. Every successor inherits this same recursive SLE requirement unless the owner explicitly changes it.
