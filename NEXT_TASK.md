# CURRENT OVERRIDE — v1.8.1-r3 CONNECTED ACCOUNT RECOVERY HOTFIX — 2026-08-25 ET

Status: RELEASE CANDIDATE / NOT PRODUCTION-PROVEN / RJR-1 `76/100` while deployed r2 regression remains active / STAGE 5 LOCKED.

Authorized release candidate: `v1.8.1 / 1.8.1-r3`.

Current production runtime is `v1.8.1 / 1.8.1-r2`, but it has an owner-proven production Connected Account regression. Previous known-good whole-shell recovery runtime is deliberately `1.8.1-r1`, not r2.

## Exact blocker and authority

Owner screenshots from both iPhone Safari and the installed application show r2 at `Local only`, `Not signed in`, with `Connected account services are unavailable`. The matching deployed Stability lane verified all 89 production runtime files and then captured reCAPTCHA Enterprise `403 appCheck/initial-throttle` with a 24-hour retry block.

Current source proves the application successfully initializes Firebase App plus App Check, then treats App Check `getToken()` observation failure as fatal by clearing the Firebase App. That prevents Google Auth and memory-only Firestore account services from initializing even though App Check enforcement remains OFF.

The authorized r3 repair is narrowly bounded: keep production origin/config/project/bootstrap and Firebase App/App Check initialization fail-closed; after those initialize successfully, an App Check token-observation failure while enforcement is OFF becomes `ready-app-check-degraded` rather than a total Connected Account outage. Retain the successfully initialized Firebase App so existing Google Auth and memory-only Firestore can initialize under the unchanged strict authorization boundaries. Raw App Check tokens must never enter diagnostics.

Do not enable App Check enforcement, change reCAPTCHA/Firebase provider configuration, use a debug provider/token, change billing, weaken Firestore Rules, change auth persistence/scopes, change canonical storage, create a replacement rivalry, or begin Stage 5.

## Required candidate gates

1. Keep whole-shell identity coherent at `v1.8.1 / 1.8.1-r3`; Service Worker recovery target must remain known-good `1.8.1-r1`.
2. Deterministically prove normal App Check token success remains `ready`; token-observation failure under enforcement OFF becomes connected `ready-app-check-degraded`; real App/App Check initialization failure remains fatal.
3. Prove degraded App Check observation still permits Google Auth plus memory-only Firestore account-service initialization with `browserSessionPersistence`, popup-only sign-in and zero additional scopes.
4. Preserve Firebase Spark / zero billing, unchanged production Rules, exactly two private managers and all Stage 4 safety boundaries.
5. Require all 14 permanent workflow families green on the exact unchanged candidate head, clean reviews/threads and mergeability before expected-head squash merge under standing owner authorization.
6. Deploy through the normal GitHub Pages path and prove exact deployed byte identity. Do not fake App Check token traffic if the provider remains externally throttled.
7. Owner acceptance after deployment must prove ordinary iOS Connected Account is available, Google popup sign-in succeeds and strict self-account bootstrap reaches `Private account ready`.
8. Only that production owner proof may restore the two RJR credits currently withdrawn by the regression, returning 76 toward 78 if the exact prior capabilities are genuinely restored.

After Connected Account recovery is production-proven, resume the existing Nik/Gop rivalry pointer recovery using the same original rivalry. Do not create a replacement pairing. The all-zero unavailable-code fixture remains unconsumed. Do not Publish, Preview or Candidate C Apply during pointer recovery.

## Permanent product locks

The Installable Offline App remains the local-first recovery baseline. The completed `v1.3.0 Recovery & Device Resilience Hardening` baseline remains intact. Local Profiles and Save Library remain the local identity and multi-save foundation. Canonical storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; `activeShowdown` is non-canonical.

Candidate C remains the sole destructive remote-to-local Apply authority with immutable intent, backup first, strict exact raw snapshot authority, transaction-owned mutation, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification. No public discovery/community/matchmaking/rankings are authorized. Stage 5 Remote Joining sessions remain locked.

## Historical authority

The complete pre-r3 `NEXT_TASK.md` was preserved byte-for-byte before this concise current-authority replacement at `authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md`. Historical authority remains provenance only and cannot override this current owner-directed regression repair.
