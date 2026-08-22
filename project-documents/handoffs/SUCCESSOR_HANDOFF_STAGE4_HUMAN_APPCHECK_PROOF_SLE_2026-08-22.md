# FIFA 17 Career Mode Showdown — SLE Successor Handoff — Stage 4 Human App Check Proof

Date: 2026-08-22 ET
Closing environment: `we-2026-08-22-stage4-r2-production-proof`
Closing decision: `HANDOFF_AT_CHECKPOINT` — closing environment only; successor must not inherit it.

## 1. Mission

Continue the FIFA 17 Career Mode Showdown PWA for owner Hawk / `nikahanghojjati-oss`. Highest long-term priority remains full Private Remote Joining, completed dependency-first and stability-first without sidequests or repeated setup.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This handoff is orientation, not live authority. Current source, live GitHub/provider/deployment state and later owner instructions win. Before mutation, independently fetch current main, PRs/heads, changed files, workflows, reviews/threads, mergeability and provider evidence. Validate and archive the predecessor WEC, initialize a fresh successor WEC with reset counters, and make a new continuity decision.

## 2. Exact authority chain

- Last fully production-proven whole-shell capability baseline remains Stage 3 `v1.6.0 / 1.6.0-r1`, merge `5d254cea6e4deebd2aac79effeda30dcc3048385`.
- Stage 4 immutable source seal: `7336adda832322bbd93e8c16f3de0e4bbf5273c1`.
- Exact reviewed and production-published Stage 4 Firestore Rules blob: `ecc8ccb2ab50f0f7057ab3170eb080ad9e36025f`.
- PR #130 Stage 4 Connected Rivalry merge: `d0eb160d62a05ebdc5c68b5b79447ce1fedffc05`.
- PR #131 r2 exact reviewed head: `ab487cec1ba2d0d6c466d8046235e1e901569f80`.
- PR #131 runtime release merge: `ce09cbef6030bcd1329121be556ba4da2fe20fd2`.
- Current r2 application/runtime identity: `v1.7.0 / 1.7.0-r2`.
- Known-good recovery runtime: `1.6.0-r1`; never use mixed `1.7.0-r1` cache as recovery authority.
- Continuity-only PR #132 merge: `212c232d0572b15316c724f957adc3e17dd8595c`.
- PR #133 initial diagnostic head: `e44faca8e98adfd51d6f62f7cb61493ad73c17e7`.
- PR #133 final exact sealed head: `06f068c6f66ded465bea563755e54d543cb3f744`.
- PR #133 expected-head squash merge / current pre-handoff main: `d3ae21ebfded08e45d9a0db61cf22948e1539df3`.

Any newer main created by this SLE package is continuity-only. Compare it against `d3ae21e...`; stop if runtime, Rules, workflow or product-test bytes changed unexpectedly.

## 3. What PR #133 changed and proved

The first three post-r2 hosted deployed smokes reproduced the same opaque `app-check-runtime-unavailable` result. The existing audit also retained one stale pre-Stage-4 assertion that browser Firestore writes were `deny-all` instead of the already-reviewed Stage 4 scope.

PR #133 made the smallest observability correction:

- corrected the stale audit expectation to `spark-private-account-device-pairing-connected-rivalry-state`;
- captured App Check dependency request failures and HTTP failures;
- captured relevant warning/error/page-error messages;
- redacted Firebase browser API keys, URL query strings and unsafe URL text;
- added permanent contracts for the corrected write scope and redaction behavior;
- changed no runtime, Firestore Rules, workflow, storage, provider, enforcement, billing or version byte.

Local validation passed syntax checks, the focused production App Check contract, the explicit static release contract, all 68 repository contract files and `git diff --check`.

Diagnostic head `e44faca...` passed all 14 PR workflow families. The WEC-only seal `06f068c...` was the final branch mutation and also passed all 14 workflow families. Submitted reviews and inline review threads remained zero; mergeability stayed clean. The PR was marked ready and squash merged with exact expected-head protection.

## 4. Exact post-merge production evidence

Main `d3ae21e...` started 15 push workflows.

- Pages run `32579873745`: success.
- Thirteen non-Stability validation families: success.
- Stability run `32579873735`: failure only in `deployed-site-smoke`.
- Stability contracts: success.
- Chromium Stability: success.
- Deployed-site job `97047866345` step `Wait for Pages and verify every runtime byte`: success, all 89 runtime files matched `1.7.0-r2` byte for byte.
- Runtime error provenance: success.
- Production App Check token path: failure.
- Later deployed-browser steps were skipped because the shell workflow is fail-fast after App Check.

The corrected redacted evidence contained:

- `requestfailed`, `POST`, `https://www.google.com/recaptcha/enterprise/clr`, `net::ERR_ABORTED`;
- Firebase App Check SDK warning: `403` and `appCheck/initial-throttle` for one day;
- application warning that production App Check was temporarily unavailable while local mode remained active;
- no Firebase API key, site key, raw App Check token or URL query string.

Cloud-browser DOM observation separately proved revision `1.7.0-r2`, footer `v1.7.0 · Connected Rivalry`, and Home `LOCAL / SAVE LIBRARY` unchanged after more than 20 seconds. Its isolated browser world could not access the page-world runtime global, so this observation is shell identity proof only and is not used as token proof.

## 5. Provider classification

Current Firebase web-provider guidance says App Check classifies some environments, including continuous-integration environments, as invalid and directs CI testing to the debug provider: `https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider`.

Inference from the official guidance plus the exact evidence: the repeated failure is now classified at the headless-CI reCAPTCHA Enterprise attestation/provider boundary, not as a changed deployed r2 byte or first-party runtime regression. A configuration mismatch cannot be completely excluded without an ordinary-browser result or direct provider inspection, so do not overstate the classification.

The project correctly prohibits production debug App Check. Do not make headless CI look green by enabling a production debug token, lowering the risk threshold, recreating or rotating the existing key/App Check registration, enabling enforcement, adding billing, suppressing the assertion or accepting an unavailable token as success.

Do not rerun the same hosted proof repeatedly. The earlier two main pushes, one deliberate failed-job rerun and the PR #133 post-merge run already establish reproducibility.

## 6. Smallest owner-only unlock

No Firebase setup, account bootstrap, registered-device setup, private pairing, reinstall or Rules publication is to be repeated.

Use the owner's existing ordinary already-paired production browser. After the public site has been open for about 20 seconds, run this read-only DevTools Console expression:

`JSON.stringify(window.CareerModeProductionFirebaseRuntime?.diagnostics?.())`

The diagnostics object does not contain the raw App Check token. Return only the JSON result.

Decision fork:

1. If `status` is `ready`, `connected` is `true`, and `tokenObserved` is `true`, record genuine ordinary-browser App Check proof. Continue Connected Rivalry proof in that same existing paired session.
2. If the ordinary browser also reports unavailable, inspect the existing Firebase App Check Web App registration, the existing reCAPTCHA Enterprise key's production-domain binding and provider metrics through a connected provider surface or the owner's existing console session. Verify exact current settings; do not recreate them.
3. If the runtime global is absent, first hard-refresh the exact production URL and wait for the local-first shell's lazy production runtime. Do not reinstall or re-pair.

## 7. Genuine Connected Rivalry proof sequence

After ordinary-browser App Check is ready:

1. Open Settings > Connected Rivalry in the already-paired Manager A browser.
2. Reuse its saved pointer. Attach/verify the exact private rivalry code only if the pointer is missing; this is not re-pairing.
3. Refresh authoritative state. If none exists, publish the local Save projection and prove revision 0. If state exists, record and preserve its immutable observed base revision.
4. In the already-paired Manager B browser, refresh the same rivalry and prove the same state is observed without overwriting canonical local saves.
5. Publish one real update and prove revision advances monotonically.
6. Hold one side on an old base, advance from the other side, then prove stale publish is rejected with refresh guidance. No silent rebase and no last-writer-wins.
7. When safely repeatable, prove exact idempotency replay returns the accepted revision without a duplicate revision; same-key/different-request conflicts.
8. When safe, prove a third account cannot read/mutate the private rivalry and a revoked device cannot mutate it.
9. Prove local-only Career Mode remains available and Stage 5 session writes remain denied.
10. Record exact production evidence and update RJR-1 only for fixed-domain capabilities genuinely demonstrated.

## 8. Stage 4 hardening before Stage 5

After first genuine proof, remain in Stage 4 for two-device/two-network evidence, adverse network and reconnect, auth/token expiry, revoked device, sleep/wake/refresh, stale/replay messaging and clear local-versus-remote state communication.

Complete an explicit reviewed remote-to-local reconciliation contract before remote state can influence local canonical saves. It must define exact pre-state snapshot authority, anti-clobber behavior, rollback ownership, stale-state rejection, and UI distinction between observed remote state and committed local state. Reuse Candidate C transaction ownership, strict exact raw snapshot authority and exact recovery verification; do not create a second casual destructive path.

## 9. Locked product/security boundaries

- App Check enforcement remains OFF.
- Firebase Spark / zero billing remains mandatory.
- Firestore persistent cache remains disabled/memory-only.
- Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.
- No Blaze, Cloud Run, Cloud Functions or Firebase Storage.
- Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` is non-canonical.
- Candidate A remains non-mutating export.
- Candidate B remains read-only import analysis.
- Candidate C remains the sole destructive local Apply authority.
- Client `baseRevision` remains immutable across retries; no silent rebase.
- Exact idempotency replay does not increment revision; same key with a different request conflicts.
- Tombstoned shared state cannot be resurrected by ordinary publish.
- Exactly two managers; no public discovery/community/matchmaking/invite directory/global leaderboard/rankings.
- Stage 5 session orchestration remains blocked.

## 10. Tooling and reliability notes

The local GitHub CLI bootstrap installed checksum-verified `gh` 2.98.0, but this environment had no CLI authentication. The connected GitHub app and public GitHub Actions API supplied authoritative GitHub evidence without burdening the owner.

The local `npm ci` route was stopped after two cache-permission failures; do not repeat it in the same environment without a materially different dependency route. Direct Node contract execution was sufficient and all 68 contract files passed.

Four recoverable tool-routing errors and one repeated cloud-browser page-world probe attempt are recorded in WEC. The final blocked browser URL action was not worked around. No repository/provider mutation resulted, and no cloud-browser global probe is used as App Check proof.

## 11. WEC/SLE transition

The closing environment reached `HANDOFF_AT_CHECKPOINT` with a distinct owner-browser production-proof milestone next. The decision belongs only to `we-2026-08-22-stage4-r2-production-proof`.

A successor must verify the closing SLE PR/merge and live main, archive this status/history, create a fresh unique WEC, reset its counters, record the exact ordinary-browser proof task and run a fresh assessment. Usage remains unavailable and must not be estimated.

At the successor's own Handoff proximity 100%, repeat the complete Smart Lean Efficient package and stop before another substantial milestone.

## 12. Mandatory SLE continuity language

SLE = Smart Lean Efficient.

IMMEDIATE NEXT TASK AFTER FULL STUDY: obtain one redacted App Check diagnostics result from the owner's existing ordinary paired production browser, then use that same already-paired context for genuine Connected Rivalry production proof; Stage 5 remains blocked.

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
