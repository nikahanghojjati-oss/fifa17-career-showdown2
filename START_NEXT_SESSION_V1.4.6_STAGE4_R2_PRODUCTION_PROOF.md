# START NEXT SESSION — v1.4.6 — Stage 4 r2 Production Proof

You are continuing the FIFA 17 Career Mode Showdown PWA for owner Hawk / `nikahanghojjati-oss`.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Read `SESSION_BOOTSTRAP.json`, `WORK_ENVIRONMENT_STATUS.json`, `REMOTE_JOINING_READINESS.json`, `SUCCESSOR_HANDOFF_STAGE4_R2_PRODUCTION_PROOF_SLE_2026-08-22.md`, `RELEASE_V1.7.0_R2.md`, `00_SLE_HANDOFF_PROTOCOL.md`, and `00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md` before substantial mutation.

Live-first rule: independently fetch current `main`, current PR/workflow/deployment state and provider state when accessible. This starter is orientation only. Do not inherit the predecessor WEC `PREPARE_HANDOFF` decision; validate it, archive it, initialize a fresh successor WEC and make your own continuity decision.

## Runtime and provider authority

- Authoritative r2 runtime release merge: `ce09cbef6030bcd1329121be556ba4da2fe20fd2` — PR #131, `v1.7.0 / 1.7.0-r2`.
- PR #131 exact reviewed head: `ab487cec1ba2d0d6c466d8046235e1e901569f80`.
- PR #131 passed all 14 permanent workflow families, including the full Chromium Stability journey and a five-second delayed assertion that the footer remains `v1.7.0 · Connected Rivalry` and Home remains `LOCAL / SAVE LIBRARY`; reviews 0, inline threads 0, mergeability clean before expected-head squash merge.
- Previous Stage 4 merge: `d0eb160d62a05ebdc5c68b5b79447ce1fedffc05` — PR #130.
- Immutable Stage 4 source seal: `7336adda832322bbd93e8c16f3de0e4bbf5273c1`.
- Exact reviewed and production-published Stage 4 Firestore Rules blob: `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`.
- Known-good whole-shell recovery runtime: `v1.6.0 / 1.6.0-r1`.
- RJR-1 remains `69/100`.

Any `main` SHA newer than `ce09cbef...` created by the predecessor's final SLE package is continuity-only. Verify that comparison before treating `ce09cbef...` as runtime authority. Do not infer that a documentation-only newer main is a new runtime release.

## What is proven vs not proven

Proven: Stage 4 Rules publication, r2 source/release identity, 14-family exact-head PR gate, delayed browser shell identity regression, static `LOCAL / SAVE LIBRARY`, footer source `v1.7.0 · Connected Rivalry`, r2 namespace, and `1.6.0-r1` recovery target.

Not yet claimed: independent observation of the post-merge push Stability Lane/GitHub Pages deployment for `ce09cbef...`, and genuine two-account Connected Rivalry production behavior. Do not increase RJR from source/CI/docs/provider publication alone.

## Immediate bounded lane

First prove the deployed r2 shell, then prove genuine Connected Rivalry. Do not start Stage 5.

1. Independently verify current main and compare any post-`ce09cbef` continuity commits to prove runtime/Rules bytes are unchanged.
2. Prefer automation. If Work / GPT-5.6 Sol Max exposes GitHub CLI/shell, use `npm run work:gh:bootstrap`, inspect the post-merge push Stability Lane, GitHub Pages deployment and deployed-site evidence. If it exposes a Firebase/provider connection, request/connect it and inspect provider state directly rather than asking the owner for screenshots.
3. Verify production serves `1.7.0-r2`, footer remains `v1.7.0 · Connected Rivalry` after startup settles, and Home remains `LOCAL / SAVE LIBRARY`. Run and inspect repository visual/browser/deployed-site tests yourself when possible.
4. Reuse the already-completed Firebase project, Web App, Google Auth, App Check, Connected Account, registered-device and private-pairing setup. Do not ask the owner to repeat them. Do not republish Firestore Rules.
5. In Settings > Connected Rivalry, reuse the already-paired accounts and stable local manager bindings. Attach/verify the exact private rivalry code if the pointer is not already saved; this is not re-pairing.
6. Manager A: refresh authoritative state. If none exists, publish the local Save projection and prove revision 0. If state already exists, preserve the observed immutable base revision.
7. Manager B: refresh the same rivalry and prove the same authoritative state is observed without overwriting canonical local saves.
8. Prove a real cross-account update advances revision monotonically; prove a stale base is rejected rather than silently rebased.
9. When safely repeatable, prove exact idempotency replay returns the accepted revision without creating a duplicate revision; same-key/different-request must conflict.
10. When safe, prove third-account denial and revoked-device mutation denial; preserve local-only fallback and Stage 5 session-write denial.
11. Record genuine production evidence precisely and update RJR-1 only for genuinely proven fixed-domain capabilities.

After first genuine Stage 4 proof, harden within Stage 4: two physical devices, preferably two networks; adverse network/token expiry; revoked device; sleep/wake/refresh; stale/replay/local-vs-remote UX. Before Stage 5, complete the explicit remote-to-local reconciliation contract. Reuse Candidate C transaction ownership, exact pre-state snapshot, anti-clobber, rollback ownership and exact recovery verification; do not casually create a second destructive local-save path.

## Locked boundaries

App Check enforcement remains OFF. Firebase Spark / zero billing. Firestore persistent cache disabled/memory-only. Google Auth popup-only `browserSessionPersistence`, no extra scopes. No Blaze, Cloud Run, Cloud Functions or Firebase Storage. Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` is non-canonical. Candidate A remains non-mutating, Candidate B read-only, Candidate C sole destructive local Apply authority. Exactly two managers. No public discovery/community/matchmaking/public invite directory/global leaderboard/rankings.

## Successor operating instruction

Use stronger capabilities aggressively but truthfully. Automate provider/GitHub/deployment/visual evidence collection instead of outsourcing it to the owner. Ask the owner only for genuinely owner-only authentication or physical-device actions. Stay on the single Remote Joining dependency lane, make the smallest safe changes, and do not repeat generic setup or earlier proven work.

## Mandatory SLE continuity language

SLE = Smart Lean Efficient.

IMMEDIATE NEXT TASK AFTER FULL STUDY: independently prove the deployed `v1.7.0 / 1.7.0-r2` shell and then obtain genuine Connected Rivalry production evidence using the already-paired accounts and registered devices; Stage 5 remains blocked.

Standing owner authorization remains active: after all required tests and mandatory gates pass, merge and deploy without asking for repeated owner approval, while preserving expected-head protection and deployment verification.

Remote Joining readiness: 69/100. Do not move it for this handoff package.

Every substantive owner-facing project response must end with these seven lines in this order:

Handoff proximity: X%
Remote Joining readiness: X/100
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...
