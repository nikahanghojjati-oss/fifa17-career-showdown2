# SUCCESSOR HANDOFF — post PR #147 r3 production proof / `fireauth` blocker — 2026-08-25 ET

SLE = Smart Lean Efficient.

Treat this file as deep-reference orientation only. Current live GitHub/source/provider/deployment state and later owner instructions always win.

## Project

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

Owner priority: finish every genuine dependency safely toward stable private Remote Joining. Do not drift into history/process sidequests. Stability, identity, security, recovery, deterministic testing and production proof outrank speed.

## Exact live boundary at predecessor handoff

Current verified live `main`: `449c5d07f79ede8814eab2f6cbbe6656f10b973b`.

That main is PR #147 squash merge, title `Keep r3 production smoke valid during unenforced App Check degradation`.

PR #147 final exact head: `5a02f0645bb935d7e11ea357829cb3b3756ea1ab`.

PR #147 exact-head permanent workflow families: 14/14 completed successfully before merge. It changed production-proof tests/current authority only; it did not change product runtime bytes.

Authoritative runtime release remains PR #146 squash merge `857727586d548a96fca3ad63c394bf8f0b9e3b90`.

Application/runtime: `v1.8.1 / 1.8.1-r3`.

PR #146 final exact head: `649112cd91db3696dd5a847250d6f1c09fc9912f`.

PR #146 passed all 14 permanent workflow families and all review threads were resolved before expected-head squash merge.

GitHub Pages r3 deployment run: `32883493535`, success.

Previous known-good whole-shell recovery runtime remains `1.8.1-r1`. Do not deliberately roll back to r2 because r2 has the owner-proven Connected Account outage regression.

Firestore Rules were not changed by PR #146 or #147. Do not republish unchanged Rules merely to investigate this lane.

App Check enforcement remains OFF. Firebase remains Spark / zero billing. Firestore remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with zero additional scopes.

## Why r3 exists

Owner screenshots on both iPhone Safari and installed PWA proved production r2 showed `Local only`, `Not signed in`, and `Connected account services are unavailable`.

Exact production evidence showed reCAPTCHA Enterprise returned `403 appCheck/initial-throttle` and Firebase JS applied a one-day retry throttle. r2 had incorrectly treated post-initialization App Check `getToken()` observation failure as fatal, cleared the successfully initialized Firebase App, and thereby disabled Google Auth plus memory-only Firestore even though App Check enforcement was OFF.

r3 fixes that one architecture defect. Successful Firebase App + App Check initialization remains required and true bootstrap/config/project/App/App Check initialization failures remain fail-closed. Only a later token-observation failure while enforcement is OFF becomes `ready-app-check-degraded`. The initialized Firebase App is retained so Connected Account can still initialize Auth and memory-only Firestore. Raw App Check tokens never enter diagnostics.

Deterministic contracts prove:

1. normal token success remains `ready` and token-observed;
2. synthetic post-initialization `getToken()` outage becomes `ready-app-check-degraded`, connected, token not observed, App Check degraded;
3. degraded state still permits Google Auth plus memory-only Firestore account services;
4. real App Check initialization failure remains fatal.

Do not remove App Check, enable a debug provider/token, lower provider security blindly, change billing, broaden Rules, or redo Firebase fundamentals to solve this lane.

## PR #147 production-proof correction

The first r3 post-deploy Stability run verified all 89 runtime files byte-for-byte but its browser App Check proof still required exact `ready` plus `tokenObserved=true`. Under the real provider throttle the product correctly produced `ready-app-check-degraded`, so the stale audit stopped the production smoke.

PR #147 changed that audit only enough to distinguish:

- `ready`: must have a legitimate observed token and `appCheckDegraded=false`;
- `ready-app-check-degraded`: may pass only with connected Firebase App/App Check, enforcement OFF, `tokenObserved=false`, `appCheckDegraded=true`, and preserved redacted provider/runtime failure evidence.

Every other fatal runtime state still fails. Degraded attestation is never mislabeled as successful token proof.

## Post-PR147 main Stability proof and current exact blocker

Main Stability run: `32886420964`.

`stability-contracts` job `97927845111`: SUCCESS.

`chromium-stability` job `97928025178`: SUCCESS.

`deployed-site-smoke` job `97928827439`:

1. `Wait for Pages and verify every runtime byte`: SUCCESS. All 89 deployed runtime files matched `1.8.1-r3` byte-for-byte.
2. Runtime error provenance audit: SUCCESS.
3. Production App Check boundary: SUCCESS. Exact successful message says deployed r3 initialized Firebase App + App Check, preserved connected runtime after token-observation failure, retained redacted provider evidence, and loaded no client Auth/Firestore/Storage/Functions SDKs in that proof lane.
4. Home visual audit then ran and its visual/layout cases passed up to the Settings install companion.
5. `tests/browser/settings-install-audit.cjs` failed on: `Settings install audit emitted page errors: fireauth is not defined`.
6. Because that step failed, downstream deployed-site Save Library, manager identity, Career Analytics, football visual, Candidate A, Candidate B, Candidate C, offline and complete-journey audits were skipped.

This is now the sole demonstrated technical blocker before owner acceptance.

## `fireauth` investigation facts versus hypothesis

Facts:

- repository code search at this checkpoint found no first-party literal `fireauth` symbol;
- `tests/browser/settings-install-audit.cjs` currently subscribes to Playwright `pageerror`, stores only `e.message`, and fails when any page error exists;
- therefore the failing evidence currently proves the message but does not prove its source URL/stack;
- Settings opening can initialize Connected Account account services, and `js/sparkConnectedAccount.js` calls the production runtime account-service path, prepares session-only Firebase Auth, attaches `onAuthStateChanged`, and uses `signInWithPopup` only when the owner explicitly signs in;
- the failure occurred in a headless Chromium production audit using an iPhone Safari user-agent profile after the App Check gate had already passed.

Working hypothesis only, not yet authority: `fireauth is not defined` is likely emitted by Firebase Auth's hosted auth iframe/runtime rather than Career Mode Showdown first-party code. Do not suppress it merely because that explanation is plausible. Prove stack/source/resource provenance first.

Preferred smallest evidence-driven correction if the hypothesis is proven: classify only the exact external Firebase Auth iframe/provider pageerror in production headless smoke, preserve sanitized evidence/count, and keep every first-party pageerror fatal. Do not create a broad ignore list. If the error is first-party or it interferes with real account behavior, fix product runtime instead.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Use connected GitHub first. Independently verify live main, open PRs, runtime identity, PR #147 state and post-merge Stability run `32886420964`. Current state wins over this file.
2. Validate/archive the predecessor WEC record and initialize a fresh unique successor WEC with every per-environment counter reset. The predecessor `HANDOFF_NOW` belongs only to the closing environment and must never be inherited as the successor decision.
3. Inspect the exact failed deployed-site log for job `97928827439` before editing anything.
4. Modify/instrument only the minimum test/runtime surface needed to determine `fireauth is not defined` provenance. Capture page-error stack/source and relevant sanitized resource origin. Do not expose account IDs, tokens, provider secrets or browser-public keys in evidence.
5. If provenance is exclusively an external Firebase Auth hosted iframe/runtime error and the audited Settings/account-service behavior remains correct, narrowly classify that exact external condition while retaining redacted evidence. Every first-party pageerror remains fatal. If provenance or behavior indicates a Career Mode Showdown defect, fix that defect instead.
6. Require the full applicable permanent PR gate on one unchanged exact head, inspect every failed job log before correction, inspect reviews/threads/mergeability, and publish only after all required gates pass under standing owner authorization.
7. After merge, require main Stability deployed-site smoke to pass the App Check proof and the Settings/Home audit and continue through every currently skipped downstream production browser audit.
8. Only once that technical production gate is clean ask the owner to run the minimum real iPhone Connected Account acceptance: confirm service available, Google popup sign-in succeeds, and strict self-account bootstrap reaches `Private account ready`.
9. Only genuine owner restoration of those two capabilities may re-credit RJR-1 from 76 toward 78.
10. After account restoration, run the original existing-rivalry owner recovery described below before Candidate C or Stage 5.

## The exact deferred Pair-ID owner test the owner remembered

This test existed before the r2 Connected Account regression and was never consumed.

Its source orientation is `START_NEXT_SESSION_V1.4.17_R2_RIVALRY_RECOVERY_OWNER_PROOF.md`.

The r2 UI change was created specifically because the old display exposed a shortened/gray rivalry fingerprint that was not safe to transcribe as durable authority. The durable ID remains exact `pair_` plus 64 lowercase hexadecimal characters. The shortened historical fingerprint `pair_a07108…756fb` is recognition-only.

After `Private account ready` is restored:

1. Use the owner's already-existing signed-in Player One / Nik context.
2. Open Connected Rivalry and confirm the complete saved rivalry ID is visible, wraps without ellipsis, is selectable, and exposes `COPY RIVALRY ID`.
3. Press `COPY RIVALRY ID`. Do not manually transcribe, shorten, migrate or transform it.
4. Do not reattach or recreate Player One merely to run this proof. Player One / Nik is the already-attached source of the original saved rivalry ID.
5. Switch only to the owner's existing signed-in Player Two / Gop context and explicitly confirm `PLAYER TWO · GOP` before mutation.
6. Paste the exact copied full ID into the existing-rivalry attachment/recovery field and attach / `VERIFY / REATTACH` exactly once.
7. Then `REFRESH SHARED STATE` on Gop and require Gop to be attached to the same original rivalry and read the expected authoritative state, historically `REMOTE OBSERVED: Revision 1`, with no canonical local Save overwrite.
8. Do not create a replacement pairing or rivalry. Do not edit the Firebase document. Do not Publish, Preview or Candidate C Apply during this pointer recovery.

This is the user's remembered test. It is not the all-zero unavailable-code test.

## Separate still-unconsumed all-zero unavailable-code proof

Only after original-rivalry recovery is stable, separately run the prior one-shot Player Two invalid/unavailable-code regression:

- Player Two / Gop selected before action;
- enter exactly `pair_0000000000000000000000000000000000000000000000000000000000000000`;
- press `JOIN PRIVATE PAIRING` exactly once;
- require safe used/expired/unavailable guidance while preserving Player Two selection;
- raw `Missing or insufficient permissions`, reset to Player One, ambiguous enumeration or any local/rivalry mutation is failure;
- prove no local Save, manager binding, rivalry pointer, Connected Rivalry revision or authoritative gameplay state changed;
- do not retry.

Do not conflate this separate fixture with the real original-rivalry recovery.

## Remote Joining readiness

Authority: `REMOTE_JOINING_READINESS.json`, fixed model RJR-1.

Current score: `76/100`.

The score was 78 before the r2 regression. Two credits were explicitly invalidated because production temporarily lost access to previously proven Google-authenticated identity and strict private self-account bootstrap. Source changes, PRs, CI, merge and deployment do not restore those credits. Only genuine ordinary-owner production proof may do so.

Stage 5 remains locked.

## Permanent locks

Canonical local storage is exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`activeShowdown` is non-canonical.

Candidate A is non-mutating export. Candidate B is read-only analysis. Candidate C is the sole destructive local Apply authority and retains immutable intent, exact target/revision/hash, backup-before-mutation, transaction ownership, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification.

Exactly two private managers. Display names never authorize identity. No public discovery, community, matchmaking, rankings or global leaderboards.

Firebase remains Spark / zero billing. App Check enforcement OFF. Persistent Firestore cache disabled / memory-only. Google Auth popup-only `browserSessionPersistence`, no extra scopes. Do not activate paid trusted runtime, Cloud Functions, Cloud Run or Storage merely to solve this lane.

Firestore Rules, provider configuration and account/device/rivalry authority must not be weakened merely to obtain green CI.

## WEC closing truth and why the prior owner reply looked like WEC disappeared

The WEC system did not disappear. `00_WORK_ENVIRONMENT_CONTINUITY.md` and `WORK_ENVIRONMENT_STATUS.json` remained in source. The prior owner-facing response failed to visibly report WEC and the machine-readable record had not yet been reassessed after PR #147 plus the newly exposed downstream failure. That reporting/update omission is itself corrected in this handoff.

At the final predecessor assessment, use these conservative observable signals:

- context complexity: high;
- project complexity: high;
- compaction count: 1;
- major phases completed: 5;
- large evidence events: 15;
- tool routing errors: 0;
- corrected failures: at least 6;
- repeated mistakes: 0;
- stale fact corrections: at least 4;
- unresolved failures: 1 (`fireauth` provenance/classification);
- usage remaining: unknown/unavailable; never fabricate it;
- handoff completeness after this package: 98;
- unrecorded decisions: 0;
- atomic operation: false.

Repository formula result from those conservative signals:

- context pressure: 97/100;
- quality risk: 80/100;
- continuation risk: 76.2/100;
- transition cost after complete handoff: 12.2/100;
- transition advantage: +64.0;
- decision: `HANDOFF_NOW`.

`HANDOFF_NOW` is required independently because quality risk reaches 80. Therefore this predecessor must not begin the `fireauth` implementation. Packaging this SLE transition is the last bounded work. The successor starts fresh, resets counters and computes its own WEC.

## Standing publication authority

`00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md` remains effective through project completion. It permits merge/deploy without repeatedly asking the owner only after all required tests and current publication gates pass. It never authorizes bypassing a failed gate.

## Smart Lean Efficient recursive rule

Every future environment inherits SLE = Smart Lean Efficient. At every Handoff proximity 100%, `HANDOFF_AT_CHECKPOINT`, `HANDOFF_NOW`, `FINISH_SAFE_BOUNDARY` or equivalent transition, create the complete root + byte-identical project-mirror handoff, newest versioned starter + mirror, refresh `SESSION_BOOTSTRAP.json` and materially changed context pointers, seal WEC, give the owner only the newest compact starter first, and stop before the next substantial milestone.

## Mandatory owner-facing progress footer

Every substantive project response ends with exactly these seven lines:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...
