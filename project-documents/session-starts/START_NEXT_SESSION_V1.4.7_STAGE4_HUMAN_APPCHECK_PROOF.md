# START NEXT SESSION — v1.4.7 — Stage 4 Human App Check & Connected Rivalry Proof

You are continuing the FIFA 17 Career Mode Showdown PWA for owner Hawk / `nikahanghojjati-oss`.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Read `SESSION_BOOTSTRAP.json`, `WORK_ENVIRONMENT_STATUS.json`, `REMOTE_JOINING_READINESS.json`, `SUCCESSOR_HANDOFF_STAGE4_HUMAN_APPCHECK_PROOF_SLE_2026-08-22.md`, `RELEASE_V1.7.0_R2.md`, `00_SLE_HANDOFF_PROTOCOL.md`, and `00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md` before substantial mutation.

Live-first rule: independently fetch current `main`, PR/workflow/deployment state and provider state when accessible. This starter is orientation only. Do not inherit the predecessor WEC `HANDOFF_AT_CHECKPOINT` decision; validate and archive it, initialize a fresh successor WEC, and make a new continuity decision.

## Exact current boundary

- Runtime release authority remains PR #131 merge `ce09cbef6030bcd1329121be556ba4da2fe20fd2`, application `1.7.0`, runtime `1.7.0-r2`.
- Immutable Stage 4 source seal remains `7336adda832322bbd93e8c16f3de0e4bbf5273c1`.
- Production-published Stage 4 Firestore Rules blob remains `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`; do not republish it.
- PR #133 `Stage 4: diagnose deployed App Check proof` final exact head `06f068c6f66ded465bea563755e54d543cb3f744` passed all 14 PR workflow families with zero submitted reviews, zero inline review threads and clean mergeability.
- PR #133 changed only `WORK_ENVIRONMENT_HISTORY.md`, `WORK_ENVIRONMENT_STATUS.json`, `tests/browser/production-app-check-runtime-audit.cjs`, and `tests/contracts/production-app-check-runtime-contracts.cjs`. It changed no runtime, Rules, workflow, provider, storage, enforcement, billing or version byte.
- PR #133 was expected-head squash-merged to main `d3ae21ebfded08e45d9a0db61cf22948e1539df3`.
- On that main push, Pages run `32579873745` and 13 other validation families succeeded. Stability run `32579873735` alone failed in deployed-site-smoke job `97047866345`.
- The hosted job proved all 89 deployed files match `1.7.0-r2` byte for byte and passed runtime provenance before App Check failed.
- Cloud-browser DOM proof independently observed revision `1.7.0-r2`, footer `v1.7.0 · Connected Rivalry`, and Home `LOCAL / SAVE LIBRARY` unchanged after more than 20 seconds. This is shell proof, not App Check token proof.
- RJR-1 remains `69/100` because genuine normal-browser App Check and two-account Connected Rivalry behavior remain unproven.

Any newer main SHA created by this closing SLE package must be continuity-only. Compare it to `d3ae21e...` before treating the above boundary as current.

## Classified App Check blocker

PR #133 added redacted provider diagnostics without exposing keys, query strings or tokens. The first post-merge run reported:

- failed `POST https://www.google.com/recaptcha/enterprise/clr` with `net::ERR_ABORTED`;
- Firebase App Check `403` followed by `appCheck/initial-throttle` for one day;
- local mode remained active;
- no first-party runtime or deployment-byte failure.

This is an attestation/provider-environment boundary, not evidence of changed r2 source bytes. Current Firebase guidance explicitly says some environments, including CI, are classified invalid and require the debug provider for CI testing: `https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider`.

Production debug App Check is prohibited here. Do not lower the risk threshold, recreate or rotate the existing key/registration, enable enforcement, add billing, weaken the audit, or rerun the same headless proof in circles merely to make CI green.

## Immediate bounded lane

First obtain one ordinary-browser App Check result, then resume genuine Stage 4 Connected Rivalry proof. Do not start Stage 5.

1. Verify current main and prove any later handoff commit is continuity-only.
2. Ask the owner for exactly one owner-only observation from the existing ordinary already-paired production browser. Do not ask for reinstall, Firebase setup, device registration or re-pairing.
3. After the production page has been open for about 20 seconds, have the owner run this read-only DevTools Console expression and return only its JSON result:

   `JSON.stringify(window.CareerModeProductionFirebaseRuntime?.diagnostics?.())`

   The diagnostics object contains no raw App Check token.
4. If it reports `status: "ready"`, `connected: true`, and `tokenObserved: true`, record genuine ordinary-browser App Check proof and continue in that same already-paired browser.
5. If it reports unavailable, inspect the existing Firebase App Check registration, reCAPTCHA Enterprise production-domain/key binding and provider metrics through an available provider connection or owner session. Verify; do not recreate setup or change security posture without exact evidence.
6. In Settings > Connected Rivalry, reuse the already-paired accounts and stable local bindings. Attach or verify the exact private rivalry code only if its pointer is not already saved; this is not re-pairing.
7. Manager A refreshes authoritative state. If none exists, publish the local Save projection and prove revision 0; otherwise preserve the observed immutable base revision.
8. Manager B refreshes the same rivalry and proves the same authoritative state is observed without overwriting canonical local saves.
9. Prove one real cross-account update increments revision monotonically and one stale base is rejected without silent rebase.
10. When safely repeatable, prove exact idempotency replay returns the accepted revision without a duplicate revision; same-key/different-request must conflict.
11. When safe, prove third-account denial and revoked-device mutation denial; preserve local-only fallback and Stage 5 session-write denial.
12. Record genuine production evidence precisely and update RJR-1 only for fixed-domain capabilities actually demonstrated.

After the first genuine Stage 4 proof, harden within Stage 4 using two physical devices, preferably two networks; adverse network/token expiry; revoked device; sleep/wake/refresh; stale/replay/local-vs-remote UX. Complete the explicit remote-to-local reconciliation contract before Stage 5, reusing Candidate C transaction ownership, exact pre-state snapshot, anti-clobber, rollback ownership and exact recovery verification.

## Locked boundaries

App Check enforcement remains OFF. Firebase Spark / zero billing. Firestore persistent cache disabled/memory-only. Google Auth popup-only `browserSessionPersistence`, no extra scopes. No Blaze, Cloud Run, Cloud Functions or Firebase Storage. Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` is non-canonical. Candidate A remains non-mutating, Candidate B read-only, Candidate C sole destructive local Apply authority. Exactly two managers. No public discovery/community/matchmaking/public invite directory/global leaderboard/rankings.

## Mandatory SLE continuity language

SLE = Smart Lean Efficient.

IMMEDIATE NEXT TASK AFTER FULL STUDY: obtain one redacted App Check diagnostics result from the owner's existing ordinary paired production browser, then use that same already-paired context for genuine Connected Rivalry production proof; Stage 5 remains blocked.

Standing owner authorization remains active: after all required tests and mandatory gates pass, merge and deploy without asking for repeated owner approval, while preserving expected-head protection and deployment verification.

Remote Joining readiness: 69/100. Do not move it for source, CI, documentation, provider inference or this handoff package.

At the successor's own Handoff proximity 100%, repeat mandatory Smart Lean Efficient SLE packaging and stop before another substantial milestone.

Every substantive owner-facing project response must end with these seven lines in this order:

Handoff proximity: X%
Remote Joining readiness: X/100
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...
