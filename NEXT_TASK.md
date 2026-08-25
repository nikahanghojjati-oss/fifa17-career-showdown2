# CURRENT OVERRIDE — v1.8.1-r3 CONNECTED ACCOUNT RECOVERY PRODUCTION PROOF — 2026-08-25 ET

Status: RELEASE CANDIDATE / DEPLOYED / TECHNICAL PRODUCTION PROOF IN PROGRESS / RJR-1 `76/100` UNTIL OWNER ACCOUNT RESTORATION PROOF / STAGE 5 LOCKED.

Current live main at this checkpoint: `449c5d07f79ede8814eab2f6cbbe6656f10b973b` from PR #147.

Authoritative runtime release remains `v1.8.1 / 1.8.1-r3` from PR #146 squash merge `857727586d548a96fca3ad63c394bf8f0b9e3b90`. PR #147 changed production-proof tests/current authority only; it did not change runtime bytes. Previous known-good whole-shell recovery runtime remains deliberately `1.8.1-r1`, not regressed r2.

## Exact completed boundary

PR #146 final exact head `649112cd91db3696dd5a847250d6f1c09fc9912f` passed all 14 permanent workflow families, all review threads were resolved, and expected-head squash merge produced runtime main `857727586d548a96fca3ad63c394bf8f0b9e3b90`. GitHub Pages deployment run `32883493535` succeeded.

PR #147 corrected only the stale headless production App Check proof expectation. Its final exact head `5a02f0645bb935d7e11ea357829cb3b3756ea1ab` passed all 14 permanent PR workflow families before merge. PR #147 merged as current main `449c5d07f79ede8814eab2f6cbbe6656f10b973b`.

Post-merge Stability run `32886420964` proves the correction worked. `stability-contracts` passed, `chromium-stability` passed, deployed-site smoke verified all 89 runtime files byte-for-byte as `1.8.1-r3`, runtime error provenance passed, and the production App Check boundary passed in the intended enforcement-OFF `ready-app-check-degraded` state while preserving redacted provider evidence.

The deployed-site smoke then advanced to the Home visual audit and exposed the next blocker in its Settings install companion: `Settings install audit emitted page errors: fireauth is not defined`. The visual/layout checks before that point passed. The downstream Save Library, identity, analytics, Candidate A/B/C, offline and complete-journey production audits were skipped because the job stopped on this page error.

Repository search at this checkpoint found no first-party `fireauth` symbol. `tests/browser/settings-install-audit.cjs` currently records every Playwright `pageerror` only by message and fails if any exist, so it does not yet prove whether this exact error originates from Career Mode Showdown or an external Firebase Auth iframe/runtime. Do not suppress it blindly. Capture source/stack provenance first.

The bounded App Check rule remains unchanged: production origin/config/project/bootstrap and Firebase App/App Check initialization stay fail-closed. A successful token remains `ready`. Only token observation failure after successful App/App Check initialization while enforcement is OFF may be `ready-app-check-degraded`, with `connected=true`, `tokenObserved=false`, `appCheckDegraded=true` and preserved redacted evidence. Connected Account remains allowed in that bounded degraded state.

Do not enable App Check enforcement, change reCAPTCHA/Firebase provider configuration, use a debug provider/token, change billing, weaken Firestore Rules, change auth persistence/scopes, change canonical storage, create a replacement rivalry, or begin Stage 5.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Initialize a fresh successor WEC first; the predecessor `HANDOFF_NOW` decision closes only its owning environment and must not be inherited.

Then finish only the r3 production proof blocker:

1. Independently verify current main, runtime identity, PR #147 merge, post-merge Stability run `32886420964`, and exact failed deployed-site job `97928827439`.
2. Inspect `tests/browser/settings-install-audit.cjs` and reproduce/capture the `fireauth is not defined` page-error provenance with stack/source and relevant sanitized resource origin. Prove whether the error is first-party or belongs only to Firebase Auth's hosted iframe/runtime in the headless mobile-emulation production audit.
3. Preserve every first-party page error as fatal. If and only if evidence proves this exact error is external Firebase Auth iframe/provider noise and the audited Settings behavior remains correct, classify only that exact externally sourced condition narrowly while retaining sanitized evidence. Do not generalize to ignoring arbitrary page errors. If it is first-party or it breaks account behavior, fix the product runtime instead.
4. Run the complete applicable permanent gate on one unchanged head. Inspect exact failures before corrections; require clean reviews, threads and mergeability; publish under standing owner authorization only when all gates pass.
5. After merge, require main Stability deployed-site smoke to verify all 89 r3 runtime bytes, pass App Check proof, pass the Settings/Home audit, and continue through every remaining production browser audit instead of skipping them.
6. Only after that technical production gate is clean ask the owner for the smallest real iPhone Connected Account acceptance: service available, Google popup sign-in, strict self-account bootstrap reaches `Private account ready`.
7. Only genuine owner restoration of those two account capabilities may return RJR-1 from 76 toward 78.

## Deferred owner test that existed before the Connected Account regression

The remembered Pair-ID test is still required and is separate from the all-zero unavailable-code fixture.

After `Private account ready` is restored:

1. In the owner's already-existing Player One / Nik context, open Connected Rivalry. Confirm the complete original rivalry ID is visible/wrapped/selectable and use `COPY RIVALRY ID` to copy the exact full durable `pair_` plus 64-lowercase-hex value. The shortened historical fingerprint `pair_a07108…756fb` is recognition-only and must never be manually typed as authority.
2. Do not reattach or recreate Player One merely to run the proof. Player One / Nik is the source of the already-saved original rivalry ID.
3. Switch only to the owner's existing Player Two / Gop context, explicitly confirm `PLAYER TWO · GOP`, paste the exact copied full ID into the existing-rivalry recovery/attachment field, and attach / `VERIFY / REATTACH` exactly once.
4. Run `REFRESH SHARED STATE` on Gop after the attachment and require Gop to be attached to the same original rivalry and read the expected authoritative state, historically `REMOTE OBSERVED: Revision 1`, with no canonical local Save overwrite.
5. Do not create a replacement pairing/rivalry, hand-edit Firebase, Publish shared gameplay, Preview, or Candidate C Apply during this pointer proof.

Only after that original-rivalry recovery is stable, separately resume the still-unconsumed one-shot Player Two unavailable-code regression proof using the already-authorized all-zero `pair_` plus 64-zero fixture exactly once. It is a different test and must not be conflated with the original-rivalry recovery.

## Permanent product locks

Canonical storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; `activeShowdown` is non-canonical. Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive remote-to-local Apply authority with immutable intent, backup first, transaction ownership, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification.

Firebase remains Spark / zero billing. App Check enforcement remains OFF. Firestore remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. Exactly two private managers remain authoritative. Public discovery/community/matchmaking/rankings/global leaderboards remain prohibited. Stage 5 Remote Joining sessions remain locked.

## Work Environment Continuity

Closing predecessor environment: `we-2026-08-25-r2-existing-rivalry-owner-recovery`.

The prior owner-facing response accidentally omitted the visible WEC result even though repository WEC files remained present. After PR #147 and the newly exposed `fireauth` failure, the predecessor's honest updated WEC reaches `HANDOFF_NOW`. That decision belongs only to the closing environment. A successor must validate/archive it, create a fresh unique environment ID with all per-environment counters reset, record current live main, and run its own assessment before implementation.

## Historical authority

The complete pre-r3 `NEXT_TASK.md` remains preserved at `authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md`. Historical completed-stage markers do not override this current r3 production-proof authority.
