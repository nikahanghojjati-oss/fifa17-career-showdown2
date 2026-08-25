# START NEXT SESSION v1.4.18 — r3 production proof / `fireauth` blocker

SLE = Smart Lean Efficient. Give this file alone to the next developer first. The successor should retrieve `SESSION_BOOTSTRAP.json` and verify live GitHub before loading deeper context. The complete fallback handoff is `SUCCESSOR_HANDOFF_POST_PR147_R3_FIREAUTH_PRODUCTION_PROOF_SLE_2026-08-25.md`.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Sealed predecessor boundary

- Current verified live main at handoff start: `449c5d07f79ede8814eab2f6cbbe6656f10b973b`, PR #147 squash merge.
- PR #147 final exact head: `5a02f0645bb935d7e11ea357829cb3b3756ea1ab`; all 14 permanent PR workflow families passed before merge. PR #147 changed proof tests/current authority, not runtime bytes.
- Runtime release remains PR #146 merge `857727586d548a96fca3ad63c394bf8f0b9e3b90`, `v1.8.1 / 1.8.1-r3`.
- PR #146 final exact head `649112cd91db3696dd5a847250d6f1c09fc9912f` passed all 14 permanent workflow families and clean review-thread gates before expected-head squash merge.
- GitHub Pages r3 deployment run `32883493535` succeeded. Previous known-good whole-shell recovery remains `1.8.1-r1`, not regressed r2.
- RJR-1 remains exactly `76/100` until genuine ordinary-owner production proof restores the two account capabilities invalidated by the r2 regression.
- Firebase remains Spark / zero billing. App Check enforcement OFF. Firestore memory-only. Google Auth popup-only `browserSessionPersistence`, no extra scopes. Rules/provider configuration were not changed by r3 proof work.
- Stage 5 remains locked.

## What r3 fixed

r2 made Connected Account unavailable whenever post-initialization reCAPTCHA Enterprise App Check `getToken()` observation received the real `403 appCheck/initial-throttle` condition. r3 keeps true Firebase App/App Check initialization failure fail-closed, but a later token-observation outage while enforcement is OFF becomes connected `ready-app-check-degraded` so Google Auth and memory-only Firestore account services are not destroyed.

PR #147 corrected the headless production audit so degraded attestation is accepted only with connected App/App Check, enforcement OFF, `tokenObserved=false`, `appCheckDegraded=true` and redacted provider/runtime evidence. It never relabels degradation as successful token proof.

## Exact current technical blocker

Post-merge main Stability run: `32886420964`.

- `stability-contracts` job `97927845111`: success.
- `chromium-stability` job `97928025178`: success.
- deployed-site job `97928827439` verified all 89 production runtime files byte-for-byte as `1.8.1-r3`: success.
- runtime error provenance: success.
- production App Check proof: success in the intended enforcement-OFF `ready-app-check-degraded` state.
- Home visual audit then reached its Settings-install companion and failed on exactly: `Settings install audit emitted page errors: fireauth is not defined`.
- downstream deployed Save Library, identity, analytics, Candidate A/B/C, offline and complete-journey checks were skipped after that failure.

Repo search found no first-party literal `fireauth`. `tests/browser/settings-install-audit.cjs` currently records only each Playwright page-error message, not its source/stack, so external Firebase Auth iframe/provider origin is a hypothesis, not yet proof.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Verify live main/current PRs/runtime and exact run/job evidence above. Current source wins.
2. Validate/archive predecessor WEC and initialize a fresh unique successor WEC with all counters reset. Do not inherit predecessor `HANDOFF_NOW`.
3. Investigate only the `fireauth is not defined` production-smoke blocker. Capture page-error stack/source and sanitized resource provenance before changing behavior.
4. Keep every first-party page error fatal. If evidence proves this exact error belongs only to Firebase Auth's external hosted iframe/runtime in headless production emulation and audited Settings behavior remains correct, narrowly classify only that exact external condition while preserving sanitized evidence. If it is first-party or breaks account behavior, fix the product runtime instead.
5. Run the complete applicable permanent PR gate on one unchanged head, inspect exact failed logs/reviews/threads/mergeability, then merge/deploy only after all gates pass under standing owner authorization.
6. Require post-merge main Stability to pass App Check, Settings/Home and every currently skipped downstream deployed-site browser audit.
7. Only then ask the owner for the minimum iPhone account acceptance: Connected Account available → Google popup sign-in → `Private account ready`.
8. Only genuine owner restoration may return RJR from 76 toward 78.
9. After `Private account ready`, resume the previously deferred original Nik/Gop Pair-ID recovery test below. Stage 5 remains locked.

## Owner test that was waiting before Connected Account broke

This is the exact test the owner recently asked to recover. It is separate from the all-zero unavailable-code test.

1. In the owner's existing Player One / Nik context, open Connected Rivalry and confirm the complete original rivalry ID is visible/wrapped/selectable. Use `COPY RIVALRY ID`; do not manually type or shorten it. The historical fingerprint `pair_a07108…756fb` is recognition-only.
2. Do not reattach/recreate Player One merely for this proof. Nik is the already-saved source of the original full ID.
3. Switch only to the existing Player Two / Gop context, confirm `PLAYER TWO · GOP`, paste the exact copied full durable ID and attach / `VERIFY / REATTACH` exactly once.
4. `REFRESH SHARED STATE` on Gop and require the same original rivalry plus expected authoritative state, historically `REMOTE OBSERVED: Revision 1`, without canonical local Save overwrite.
5. Do not create replacement pairing/rivalry, edit Firebase, Publish, Preview or Candidate C Apply.
6. Only after this recovery is stable, separately resume the still-unconsumed one-shot all-zero unavailable-code regression fixture exactly once.

## WEC handoff truth

The WEC system was not removed. The prior owner-facing reply omitted its visible result and the record had not yet incorporated PR #147 plus the new downstream failure. Honest conservative final signals now produce context pressure 97, quality risk 80, continuation risk 76.2, transition advantage +64.0 and therefore `HANDOFF_NOW`. Quality risk 80 independently triggers that decision. This predecessor must stop after complete SLE packaging; the successor initializes its own fresh WEC and may continue if its new assessment permits.

## Hard locks

Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` is non-canonical. Candidate A non-mutating, Candidate B read-only, Candidate C sole destructive Apply. Exactly two private managers. No public discovery/community/matchmaking/rankings/global leaderboard. Do not weaken Firestore Rules, App Check/provider configuration, auth/session policy, recovery, identity or zero-billing boundaries simply to obtain green CI.

Standing owner merge/deploy authorization remains valid only after all required tests/current gates pass.

Every future handoff recursively uses SLE = Smart Lean Efficient and the repository WEC protocol.

Every substantive owner-facing project response must end exactly:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...
