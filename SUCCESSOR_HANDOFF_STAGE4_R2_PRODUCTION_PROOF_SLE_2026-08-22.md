# FIFA 17 Career Mode Showdown — SLE Successor Handoff — Stage 4 r2 Production Proof

Date: 2026-08-22 ET
Closing environment: `we-2026-08-22-stage4-provider-proof`
Closing decision: `PREPARE_HANDOFF` — closing environment only; successor must not inherit it.

## 1. Mission

Continue the FIFA 17 Career Mode Showdown PWA for owner Hawk / `nikahanghojjati-oss`. Highest long-term priority remains full Private Remote Joining, but dependencies must be completed in roadmap order, stability-first, with no unnecessary sidequests or repeated owner setup.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Treat this handoff as orientation only. Current source, live GitHub state, provider/deployment state and later owner instructions win. Before substantial work, independently fetch live `main`, relevant PRs/heads, changed files, workflow results, reviews/threads, mergeability and deployment/provider evidence. Archive this predecessor WEC, initialize a fresh successor WEC and make your own continuity decision.

## 2. Exact authority chain

- Last production-proven complete capability baseline: Stage 3 `v1.6.0 / 1.6.0-r1`.
- Stage 3 runtime merge: `5d254cea6e4deebd2aac79effeda30dcc3048385`.
- Stage 3 proof: `PRODUCTION_STAGE3_PRIVATE_PAIRING_PROOF_2026-08-21.md`.
- Stage 3 RJR event: +6, from 63 to 69.
- Stage 4 immutable source seal: `7336adda832322bbd93e8c16f3de0e4bbf5273c1`.
- Exact Stage 4 Firestore Rules blob: `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`.
- Stage 4 Rules are production-published. Do not republish unless a separately reviewed Rules change or concrete regression requires it.
- PR #130 Stage 4 Connected Rivalry merged to `d0eb160d62a05ebdc5c68b5b79447ce1fedffc05`.
- Owner then observed a shell-coherence incident: the footer initially displayed `v1.7.0 · Connected Rivalry` and later displayed `v1.7.0 · Stable` in the same browser session.
- The visible `SAVE LIBRARY` tile was investigated and corrected as a false stale-deployment signal: current runtime intentionally uses `LOCAL / SAVE LIBRARY`.
- The actual defect was reuse of public `1.7.0-r1` asset identity across changed Stage 4 runtime bytes, allowing mixed cache generations.
- PR #131 bounded hotfix exact reviewed head: `ab487cec1ba2d0d6c466d8046235e1e901569f80`.
- PR #131 passed all 14 permanent workflow families, including the complete Chromium Stability journey and a five-second delayed regression assertion that footer and Home identity do not mutate after startup; submitted reviews 0; inline review threads 0; mergeability clean.
- PR #131 was marked ready and squash-merged with expected-head protection to authoritative r2 runtime release merge `ce09cbef6030bcd1329121be556ba4da2fe20fd2`.
- Application remains `v1.7.0`; runtime/public asset identity is now `1.7.0-r2`.
- Known-good whole-shell recovery remains `1.6.0-r1`; never use the potentially mixed `1.7.0-r1` cache as recovery authority.

The final SLE handoff merge after `ce09cbef...` is continuity-only. A successor must compare current `main` against `ce09cbef...` and verify no runtime, Rules or tests changed before using `ce09cbef...` as runtime authority.

## 3. What this environment proved

Provider proof: before the Stage 4 provider mutation, production Rules matched exact Stage 3 blob `bf307c52262faf81a484e33cde272ac831fe60f0`; after the single replace-all publication, the copied published Rules matched exact reviewed Stage 4 blob `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`.

Runtime/source proof: r2 uses a fresh immutable namespace, static Home starts as `LOCAL / SAVE LIBRARY`, footer source is exactly `v1.7.0 · Connected Rivalry`, service worker current revision is `1.7.0-r2`, recovery target is `1.6.0-r1`, and Stage 4 Firestore Rules were not changed by the r2 hotfix.

Browser proof: the exact PR #131 head passed all 14 permanent workflow families. Chromium Stability completed the canonical runtime, Save Library, offline lifecycle and full browser journey including the new five-second delayed footer/Home identity assertion.

Merge proof: PR #131 was merged with expected-head protection. Runtime release merge is exactly `ce09cbef6030bcd1329121be556ba4da2fe20fd2`.

## 4. What remains explicitly unproven

This closing environment could not independently enumerate post-merge push-triggered workflow runs through its GitHub connector, and direct public GitHub Pages HTTP access was unavailable. Therefore it does not claim independent deployed-site proof for the r2 merge even though the repository's main Stability workflow contains a deployed-site smoke job.

Genuine production Connected Rivalry capability also remains unproven. Do not infer it from source, emulator, Rules publication, PR CI or merge state.

RJR-1 therefore remains exactly `69/100`.

## 5. Immediate successor execution sequence

1. Independently fetch current `main`. Compare it to `ce09cbef6030bcd1329121be556ba4da2fe20fd2`. Any later predecessor SLE merge must be continuity-only; if runtime/Rules/test bytes differ, stop and investigate rather than assuming the r2 seal still applies.
2. Use stronger automation where genuinely available. If shell/CLI exists, use repository bootstrap `npm run work:gh:bootstrap`; inspect GitHub push workflow runs, Pages deployment and deployed-site artifacts directly. If a Firebase/provider connector is available, request/connect it and inspect provider state directly. Do not fabricate access.
3. Prove deployed runtime identity: app `v1.7.0`, revision `1.7.0-r2`; footer remains `v1.7.0 · Connected Rivalry` after startup settles; Home remains `LOCAL / SAVE LIBRARY`; deployed runtime bytes match the reviewed r2 release.
4. Reuse completed setup. Do not ask the owner to recreate Firebase project/Web App, Google Auth, App Check, Connected Account, registered devices, private pairing, or Rules publication.
5. Reuse the two already-paired private accounts and their stable local manager identities. In Settings > Connected Rivalry, attach or verify the exact private rivalry code only if needed; this is not re-pairing.
6. Manager A: refresh authoritative state. If none exists, publish the local Save projection and prove revision 0. If state exists, use the observed immutable base revision.
7. Manager B: refresh the same rivalry. Prove it observes the authoritative state without overwriting canonical local saves.
8. Produce a genuine cross-account state change and prove revision increments monotonically.
9. Hold one side on an older observed base, change state from the other side, then prove the stale publisher is rejected and instructed to refresh; no silent rebase and no last-writer-wins.
10. When safely repeatable, prove exact idempotency replay returns the accepted revision without a duplicate revision. Reusing the key for a different request must conflict.
11. When safe, prove a third account cannot access/mutate the private rivalry and a revoked device cannot mutate it. Local-only Career Mode must remain available.
12. Confirm Stage 5 session writes remain denied and no remote refresh silently mutates canonical local Save Library.
13. Record precise production evidence and update RJR-1 only for genuine fixed-domain capabilities actually proven.

## 6. Stage 4 hardening after first genuine proof

Do not jump to Stage 5 immediately after the first happy-path proof. Complete focused Stage 4 hardening: two physical devices, preferably two networks; adverse-network and reconnect behavior; auth/token expiry; device revocation; sleep/wake/refresh; stale/replay UX; clear local-vs-remote state communication. Keep scope bounded to readiness for Remote Joining.

Before Stage 5 can influence local canonical saves, complete an explicit reviewed remote-to-local reconciliation contract. It must answer when remote state may influence local canonical saves, what exact pre-state snapshot is captured, how anti-clobber works, who owns rollback, how stale state is rejected, and how the UI distinguishes observed remote state from committed local state. Reuse Candidate C transaction ownership, strict exact raw snapshot authority, rollback ownership and exact recovery verification instead of creating a second casual destructive path.

## 7. Locked product/security boundaries

- App Check enforcement remains OFF.
- Firebase Spark / zero billing mandatory.
- Firestore persistent cache disabled/memory-only.
- Google Auth popup-only `browserSessionPersistence`, no additional scopes.
- No Blaze, Cloud Run, Cloud Functions or Firebase Storage unless later explicitly authorized.
- Canonical localStorage exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` non-canonical.
- Candidate A non-mutating export.
- Candidate B read-only import analysis.
- Candidate C sole destructive local Apply authority.
- Exactly two managers.
- No public discovery/community/matchmaking/public invitation directory/global leaderboard/rankings.
- Client `baseRevision` remains immutable across retries/reconnect; no silent rebase.
- Exact idempotency replay must not mutate or increment revision; same key with different request conflicts.
- Tombstoned shared state cannot be resurrected by normal publish.
- Stage 5 Remote Joining session orchestration remains blocked until Stage 4 production proof plus the remote-to-local reconciliation gate.

## 8. Owner-effort and successor capability rule

The owner explicitly expects the next Work / GPT-5.6 Sol Max environment to automate more than this environment could. Use those capabilities aggressively but truthfully when available. Prefer direct Firebase/provider connection over screenshots, direct visual/browser/deployed-site testing over asking the owner to inspect the site, and GitHub CLI bootstrap/automated exact-head evidence collection over manual repository chores. Ask the owner only for genuinely owner-only authentication or physical-device actions. If a capability is unavailable, record the limitation and request only the smallest necessary owner action.

Do not run in circles. Do not repeat setup already proven. Do not turn continuity, documentation or generic hardening into a substitute for the actual Remote Joining dependency path.

## 9. WEC/SLE transition rule

The predecessor environment is transition-prepared at Handoff proximity 100%. Its `PREPARE_HANDOFF` decision applies only to the closing environment. The successor must validate predecessor facts, archive them, initialize a fresh environment ID with current live `main`, reset its own counters, record current task/checkpoint/hazards and run its own continuity assessment. Usage remains unavailable and must never be invented.

At the successor's own future Handoff proximity 100%, repeat mandatory Smart Lean Efficient packaging and stop before beginning the next substantial milestone.

## 10. Mandatory SLE continuity language

SLE = Smart Lean Efficient.

IMMEDIATE NEXT TASK AFTER FULL STUDY: independently prove the deployed `v1.7.0 / 1.7.0-r2` shell and then obtain genuine Connected Rivalry production evidence using the already-paired accounts and registered devices; Stage 5 remains blocked.

Standing owner authorization remains active: after all required tests and mandatory gates pass, merge and deploy without asking for repeated owner approval, while preserving exact-head protection and deployment verification.

Remote Joining readiness: 69/100. It remains unchanged until genuine production capability evidence exists.

Every substantive owner-facing project response must end with these seven lines in this order:

Handoff proximity: X%
Remote Joining readiness: X/100
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...
