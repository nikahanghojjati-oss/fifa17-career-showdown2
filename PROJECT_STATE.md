# CURRENT OVERRIDE — v1.8.1-r3 CONNECTED ACCOUNT RECOVERY HOTFIX — 2026-08-25 ET

Status: RELEASE CANDIDATE / NOT PRODUCTION-PROVEN.

Application: `v1.8.1`
Candidate runtime: `1.8.1-r3`
Current deployed runtime: `1.8.1-r2` with owner-proven Connected Account regression
Previous known-good whole-shell recovery runtime: `1.8.1-r1`
Remote Joining readiness: `76/100` under fixed RJR-1 while the two previously credited production account capabilities are unavailable
Stage 5: LOCKED

## Proven production incident

Owner evidence from iPhone Safari and the installed app shows deployed r2 reporting `Local only`, `Not signed in`, and `Connected account services are unavailable`. The matching current-main Stability run verified all 89 deployed files before reCAPTCHA Enterprise returned `403 appCheck/initial-throttle`, with App Check attempts blocked for 24 hours.

Source reconstruction proves r2 turns that token-observation failure into a fatal Firebase runtime outage: Firebase App and App Check initialize, then `getToken()` failure clears the production Firebase App. Connected Account cannot subsequently initialize Google Auth or memory-only Firestore. App Check enforcement remains OFF, so this client-side fatal coupling is the defect.

## Candidate r3 state

The bounded r3 candidate preserves every fail-closed production origin, path, configuration, project identity and App/App Check initialization gate. Only post-initialization App Check token observation is decoupled from account availability while enforcement remains OFF. A throttled or unavailable `getToken()` result produces `ready-app-check-degraded`, retains the successfully initialized Firebase App and permits existing account services to initialize under unchanged security boundaries. Real App/App Check initialization failure remains fatal. Raw App Check tokens remain absent from diagnostics.

Whole-shell runtime identity advances coherently to `1.8.1-r3`. Service Worker rollback deliberately skips regressed r2 and targets known-good `1.8.1-r1`. The r2 full durable rivalry-ID display and `COPY RIVALRY ID` recovery UX remains present in r3.

Firebase Spark / zero billing remains unchanged. App Check enforcement remains OFF. No debug provider or token is used. Firestore Rules are unchanged. Firestore remains memory-only. Google Auth remains popup-only with `browserSessionPersistence` and no additional scopes. Exactly two private managers remain required. No public discovery/community/matchmaking/rankings are permitted.

The Installable Offline App remains the local-first recovery baseline. The completed `v1.3.0 Recovery & Device Resilience Hardening` baseline remains intact. Local Profiles and Save Library remain the completed local identity and multi-save dependency chain. Canonical local storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical.

Candidate C remains the sole destructive remote-to-local Apply authority with immutable intent, backup first, strict exact raw snapshot authority, transaction-owned mutation, stale/anti-clobber rejection, ownership-scoped rollback and exact recovery verification.

## RJR truth

Fixed RJR-1 previously stood at 78/100. The current production regression removes access to two capabilities that had explicit +1 production credits: successful Google-authenticated identity and strict authenticated self-account bootstrap. Those credits are explicitly invalidated while r2 remains broken, so current score is 76/100. Historical Stage 3/Stage 4 capabilities remain valid and are not double-penalized. Source work, tests, CI, merge or deployment alone do not restore either credit.

Only ordinary owner production evidence on deployed r3 proving Google popup sign-in and `Private account ready` can re-credit those exact capabilities.

## Immediate engineering boundary

Finish the r3 candidate, require all 14 permanent workflow families green on the exact unchanged head, clean reviews/threads and mergeability, expected-head squash merge under standing authorization, GitHub Pages deployment and exact deployed byte proof. Provider App Check throttling must remain visible evidence if it persists; do not manufacture a token or use debug bypasses.

After deployed r3 is technically proven, obtain owner iOS acceptance of Connected Account restoration. Only then resume existing Nik/Gop rivalry pointer recovery. Do not create a replacement pairing. Do not Publish, Preview or Candidate C Apply during pointer recovery. The all-zero unavailable-code fixture remains unconsumed. Stage 5 remains locked.

## Work Environment Continuity

Every successor must enter through the repository Work Environment Continuity system before executing this state. Validate the inherited record, archive predecessor final facts, initialize a fresh environment-owned status record, then run the fresh assessment. The predecessor transition decision is orientation only and never substitutes for the successor's own WEC decision. Reassess at the r3 publication boundary before beginning any separate milestone.

## Historical state

The complete pre-r3 `PROJECT_STATE.md` was preserved byte-for-byte before this concise current-state replacement at `authority-history/PROJECT_STATE_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md`. Historical text remains provenance only where it conflicts with this current override.
