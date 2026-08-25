# CURRENT OVERRIDE — v1.8.1-r3 CONNECTED ACCOUNT RECOVERY HOTFIX — 2026-08-25 ET

Status: RELEASE CANDIDATE / DEPLOYED / TECHNICAL PRODUCTION PROOF IN PROGRESS / RJR-1 `76/100` UNTIL OWNER ACCOUNT RESTORATION PROOF / STAGE 5 LOCKED.

Authorized release candidate: `v1.8.1 / 1.8.1-r3`.

Current production runtime is `v1.8.1 / 1.8.1-r3` from squash merge `857727586d548a96fca3ad63c394bf8f0b9e3b90`. Previous known-good whole-shell recovery runtime remains deliberately `1.8.1-r1`, not regressed r2.

## Exact blocker and authority

PR #146 final exact head `649112cd91db3696dd5a847250d6f1c09fc9912f` passed all 14 permanent workflow families, all review threads were resolved, and expected-head squash merge produced live main `857727586d548a96fca3ad63c394bf8f0b9e3b90`. GitHub Pages deployment run `32883493535` succeeded. Stability deployed-site-smoke job `97919366693` then independently verified all 89 runtime files byte-for-byte as `1.8.1-r3` and passed runtime error provenance.

The remaining technical proof failure is now classified: the production runtime correctly reached `ready-app-check-degraded` while reCAPTCHA Enterprise returned `403 appCheck/initial-throttle` and App Check enforcement remained OFF. The stale browser audit still required `ready` plus `tokenObserved=true`, so it failed before the downstream deployed-site browser audits could run. That audit expectation must be corrected without relabeling degraded attestation as successful token proof.

The bounded rule remains: production origin/config/project/bootstrap and Firebase App/App Check initialization stay fail-closed. A successful token remains `ready` with `tokenObserved=true`. Only a token-observation failure after successful Firebase App/App Check initialization while enforcement is OFF may be `ready-app-check-degraded`, with `connected=true`, `tokenObserved=false`, `appCheckDegraded=true` and preserved redacted provider/runtime evidence. Connected Account remains allowed in that bounded degraded state. Raw App Check tokens must never enter diagnostics.

Do not enable App Check enforcement, change reCAPTCHA/Firebase provider configuration, use a debug provider/token, change billing, weaken Firestore Rules, change auth persistence/scopes, change canonical storage, create a replacement rivalry, or begin Stage 5.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish only the post-deployment r3 production-proof correction. Validate the test-only branch that makes the headless production App Check audit distinguish real `ready` token proof from explicitly evidenced enforcement-OFF `ready-app-check-degraded`. Require all 14 permanent workflow families green on one unchanged exact head, inspect every review and inline thread, and require clean mergeability. If those gates pass, publish under standing owner authorization with expected-head squash merge. Then require main Stability deployed-site smoke to re-verify all 89 production runtime bytes and continue through every downstream deployed-site browser audit.

Do not ask the owner to test until that technical production gate is clean. The first owner acceptance test is then only Connected Account recovery on an ordinary iPhone surface: open Connected Account, confirm the service is available, complete Google popup sign-in, and require strict self-account bootstrap to reach `Private account ready`. Do not create a replacement pairing or rivalry during this recovery proof.

After `Private account ready` is restored, immediately resume the previously deferred original Nik/Gop rivalry pointer proof that was blocked before the Connected Account regression. Use the now selectable/copyable recovery-ID UI to obtain the full original Pair ID for the rivalry historically fingerprinted as `pair_a07108…756fb`; do not manually type that shortened fingerprint. Put the exact full copied ID into both Player One / Nik and Player Two / Gop recovery fields. On each side press `VERIFY / REATTACH` once, then `REFRESH SHARED STATE` once. Require the `RIVALRY` field to show that same original rivalry and require `REMOTE OBSERVED: Revision 1`. Leave the Firebase document untouched. Do not Publish, Preview or Candidate C Apply during this pointer proof.

## Required candidate gates

1. Keep whole-shell identity coherent at `v1.8.1 / 1.8.1-r3`; Service Worker recovery target must remain known-good `1.8.1-r1`.
2. Deterministically prove normal App Check token success remains `ready`; token-observation failure under enforcement OFF becomes connected `ready-app-check-degraded`; real App/App Check initialization failure remains fatal.
3. Production browser proof may accept `ready-app-check-degraded` only with enforcement OFF, connected Firebase App/App Check, `tokenObserved=false`, `appCheckDegraded=true` and preserved redacted failure evidence. It must never report degraded attestation as successful token proof.
4. Prove degraded App Check observation still permits Google Auth plus memory-only Firestore account-service initialization with `browserSessionPersistence`, popup-only sign-in and zero additional scopes.
5. Preserve Firebase Spark / zero billing, unchanged production Rules, exactly two private managers and all Stage 4 safety boundaries.
6. Require all 14 permanent workflow families green on the exact unchanged proof-correction head, clean reviews/threads and mergeability before expected-head squash merge under standing owner authorization.
7. After merge, require exact deployed byte identity and all downstream deployed-site browser audits. Do not manufacture an App Check token if the provider remains externally throttled.
8. Owner acceptance after technical proof must show ordinary iOS Connected Account is available, Google popup sign-in succeeds and strict self-account bootstrap reaches `Private account ready`.
9. Only that production owner proof may restore the two RJR credits currently withdrawn by the regression, returning 76 toward 78 if the exact prior capabilities are genuinely restored.
10. After account restoration, complete the original Nik/Gop pointer test with the exact full copied Pair ID and `REMOTE OBSERVED: Revision 1` before any separate Candidate C owner reconciliation or Stage 5 work.

The all-zero unavailable-code fixture remains unconsumed. Do not create a replacement pairing. Do not Publish shared gameplay, Preview or Candidate C Apply during pointer recovery.

## Permanent product locks

The Installable Offline App remains the local-first recovery baseline. The completed `v1.3.0 Recovery & Device Resilience Hardening` baseline remains intact. Local Profiles and Save Library remain the local identity and multi-save foundation. Canonical storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; `activeShowdown` is non-canonical.

Candidate C remains the sole destructive remote-to-local Apply authority with immutable intent, backup first, strict exact raw snapshot authority, transaction-owned mutation, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification. No public discovery/community/matchmaking/rankings are authorized. Stage 5 Remote Joining sessions remain locked.

## Work Environment Continuity

Current environment: `we-2026-08-25-r2-existing-rivalry-owner-recovery`
Starting independently verified live main: `2eb58974e615aa7f2e95419a6f0cdf20495d2682`
Current r3 production merge: `857727586d548a96fca3ad63c394bf8f0b9e3b90`

Every future environment must use the repository Work Environment Continuity process before executing this task. Validate the inherited status, archive predecessor final facts, initialize a fresh environment-owned status record, run that environment's own assessment, and treat any predecessor transition decision as orientation only. Reassess WEC after technical r3 production proof, after owner account acceptance, and before any separate milestone.

## Historical authority

The complete pre-r3 `NEXT_TASK.md` was preserved byte-for-byte before this concise current-authority replacement at `authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md`. Historical authority remains provenance only and cannot override this current owner-directed regression repair.

Historical completed-stage markers retained for permanent contracts: `CURRENT IMPLEMENTATION AUTHORITY — TRUSTED SHARED MUTATION GATEWAY` and `CURRENT IMPLEMENTATION AUTHORITY — PR #125 SPARK PRIVATE CONNECTED ACCOUNT RUNTIME`. Stage 1 Cloud / Sync Readiness Phase 1A through 1F remains DONE / MERGED / PROTECTED as completed prerequisite provenance. Private Account/Auth Stage 2A through 2I remains DONE / MERGED / PROTECTED as completed prerequisite provenance. These markers do not override the current r3 Connected Account recovery authority above.
