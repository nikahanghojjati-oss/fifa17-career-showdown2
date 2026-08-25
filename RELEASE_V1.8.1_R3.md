# Career Mode Showdown v1.8.1 — Runtime r3

Status: RELEASE CANDIDATE — PRODUCTION CONNECTED ACCOUNT RECOVERY

Application version: `v1.8.1`
Runtime asset revision: `1.8.1-r3`
Previous known-good runtime: `1.8.1-r1`

## Why r3 exists

Owner production evidence on 2026-08-25 showed `v1.8.1 / 1.8.1-r2` reporting `Local only`, `Not signed in`, and `Connected account services are unavailable` in both iPhone Safari and the installed app. The same deployed generation's Stability lane independently verified all 89 runtime files byte-for-byte and then captured reCAPTCHA Enterprise `403 appCheck/initial-throttle` with a 24-hour retry block.

Source reconstruction found that the production Firebase runtime successfully initialized the Firebase App and App Check, assigned the production app, then treated any `getToken()` failure as fatal by clearing that app. `ensureAccountServices()` consequently refused to initialize Google Auth or memory-only Firestore. This client-side coupling disabled Connected Account even though App Check enforcement is explicitly OFF.

## Bounded repair

- Production origin, path, Firebase project/configuration and App Check bootstrap validation remain fail-closed.
- Firebase App and App Check initialization failure remains fatal.
- App Check still uses the production reCAPTCHA Enterprise provider with token auto-refresh.
- A token-observation failure after successful App/App Check initialization is now classified as `ready-app-check-degraded` while enforcement is OFF.
- The initialized production Firebase App is retained in that bounded degraded state so optional Connected Account services can initialize.
- Google Auth remains popup-only with `browserSessionPersistence` and zero additional scopes.
- Firestore remains memory-only and all existing authenticated Rules/authorization boundaries remain unchanged.
- Raw App Check tokens never enter diagnostics.
- If App Check enforcement is later enabled, this release does not authorize carrying the degraded behavior across that policy change; enforcement activation remains a separate reviewed milestone.

## Rollback decision

`1.8.1-r1` remains the declared previous known-good whole shell rather than `1.8.1-r2`. Runtime r2 contains the useful full-rivalry-ID recovery UX but now has an owner-proven Connected Account availability regression. Runtime r3 includes the r2 recovery UX plus this bounded account-availability repair; rollback therefore deliberately skips r2 and retains the proven r1 shell.

## Preserved boundaries

- Firebase Spark / zero billing remains unchanged.
- App Check enforcement remains OFF.
- No debug App Check provider or debug token is introduced.
- No Firebase/reCAPTCHA provider configuration is changed.
- Firestore Security Rules are unchanged.
- Firestore remains memory-only.
- Exactly two private managers remain required.
- Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.
- Candidate C remains the only destructive remote-to-local Apply authority.
- The original Nik/Gop rivalry is not replaced or migrated.
- Remote Joining Stage 5 remains locked.
- No public discovery, matchmaking, community system, rankings or global leaderboard is introduced.

## Readiness accounting

RJR-1 is `76/100` during implementation and publication because the deployed r2 regression explicitly invalidates two previously credited production capabilities: live Google-authenticated identity and strict authenticated self-account bootstrap. This source fix, CI, release packaging, merge and deployment receive no readiness points by themselves. Only ordinary production evidence on deployed r3 that genuinely restores those capabilities may re-credit them under the fixed RJR-1 rules.

## Required promotion gates

Before production promotion, require the exact unchanged candidate head to pass all permanent workflow families, review/thread/mergeability gates, whole-shell revision coherence, deterministic App Check degradation contracts, local-first/offline/recovery contracts and the normal expected-head merge discipline. After Pages deployment, prove byte identity and then obtain ordinary owner-browser evidence that Connected Account can initialize/sign in despite the prior App Check token-throttle condition. Only after that may the paused existing-rivalry recovery proof resume.
