# Career Mode Showdown v1.8.1-r3 Maintenance Handoff

Status: RELEASE CANDIDATE / NOT PRODUCTION-PROVEN

Application version: `v1.8.1`
Runtime asset revision: `1.8.1-r3`
Previous known-good runtime: `1.8.1-r1`
Remote Joining readiness: `76/100` under RJR-1 while the deployed r2 regression remains active.

## Current incident

Owner production screenshots on 2026-08-25 show both iPhone Safari and the installed application on `v1.8.1 / 1.8.1-r2` reporting `Local only`, `Not signed in`, and `Connected account services are unavailable`. The matching current-main Stability lane independently verified all 89 deployed runtime files and then captured reCAPTCHA Enterprise `403 appCheck/initial-throttle` with attempts blocked for 24 hours.

Current r2 source initializes Firebase App and App Check successfully, assigns the production Firebase App, then calls App Check `getToken()`. Any token-observation failure falls into a fatal catch that clears the production app. Connected Account subsequently cannot initialize Google Auth or memory-only Firestore. Because App Check enforcement is OFF, the client was unnecessarily converting an attestation-observation outage into a total Connected Account outage.

## Bounded r3 repair

Runtime r3 keeps every production origin, path, Firebase configuration, project identity, App Check bootstrap and App/App Check initialization guard fail-closed. Only the post-initialization token-observation result changes: if `getToken()` is throttled or otherwise unavailable while enforcement remains OFF, runtime state becomes `ready-app-check-degraded`, the successfully initialized production Firebase App remains available, and Connected Account may initialize Google Auth plus memory-only Firestore under the existing strict authorization boundaries.

A real App/App Check initialization failure still clears the production Firebase App and remains fatal. No raw App Check token is exposed. No debug provider/token is introduced. No provider configuration, Rules, billing, authentication persistence, scopes, canonical storage or Connected Rivalry data model changes.

The whole shell advances coherently to `1.8.1-r3`. Recovery deliberately targets `1.8.1-r1`, not regressed r2. The r2 full durable rivalry-ID display/copy UX is retained in r3.

## Protected product semantics

Firebase Spark / zero billing remains unchanged. App Check enforcement remains OFF. Firestore remains memory-only. Google Auth remains popup-only with `browserSessionPersistence` and no additional scopes. Firestore Rules and exactly-two-manager private authorization remain unchanged. Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`. The Installable Offline App remains available.

Candidate C remains the sole destructive remote-to-local Apply authority with backup first, immutable intent, strict exact raw snapshot authority, transaction-owned mutation, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification. No public discovery/community/matchmaking/rankings are introduced. Stage 5 Remote Joining sessions remain locked.

## RJR handling

The deployed r2 incident removes current access to two capabilities that fixed RJR-1 had credited separately: the production Google-authenticated identity path and the authenticated self-account bootstrap path. The candidate ledger therefore records 76/100 while the regression is active. Source code, tests, CI, merge and deployment do not restore those credits. They return only after ordinary owner production evidence proves Google sign-in and `Private account ready` again on r3. Historical Stage 3 and Stage 4 evidence is not invalidated or double-penalized.

## Promotion gates

Require all permanent exact-head workflow families green, clean reviews/threads and mergeability, expected-head squash merge, successful GitHub Pages deployment and exact deployed byte identity. The provider App Check token-observation audit may continue to expose the external 24-hour throttle; do not fake or debug-bypass that evidence. The application-level acceptance criterion is that this unenforced token-observation degradation no longer disables Connected Account.

After deployed r3 is proven, obtain ordinary owner evidence that the Connected Account surface no longer reports runtime unavailable, Google popup sign-in succeeds, and self-account bootstrap reaches `Private account ready`. Then restore the two RJR credits if and only if that production evidence is valid. Only after Connected Account is restored may the existing Nik/Gop rivalry pointer recovery resume. Do not create a replacement pairing. The all-zero unavailable-code fixture remains unconsumed. Stage 5 remains locked.
