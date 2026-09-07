# Career Mode Showdown v1.9.1-r5 Runtime Hotfix

Status: RELEASE CANDIDATE
Application version: `v1.9.1`
Runtime asset revision: `1.9.1-r5`
Previous known-good runtime: `1.9.1-r4`
Remote Joining readiness: `100/100` under frozen model `RJR-1`
Shared Showdown Journey readiness: `0/100` under fixed model `SSJR-1.1`

## Purpose

This bounded runtime hotfix fixes defects exposed by the first genuine two-account SSJR production acceptance attempt. The owner successfully reached a paired `ACTIVE · REV 1` private session, but the guided recorder still routed the primary action back to Private Remote Joining while its Shared Setup authority had not yet resolved. Opening Shared Setup then exposed a separate first-party UI exception: `focus is not a function`.

## Fixes

- The SSJR guided recorder now recognizes an already ACTIVE page-memory private session without persisting or exporting its raw capability.
- When ACTIVE exists but Shared Setup is not yet resolved, the recorder routes the single primary action to Shared Setup diagnostics instead of looping back to Private Remote Joining.
- Shared Setup diagnostic text is surfaced in the recorder so an unresolved authority state is visible rather than hidden.
- `productionSharedShowdownSetup.js` now safely focuses the actual DOM button with `element.focus()` instead of attempting to call the element itself.
- Browser regressions permanently cover both the recorder ACTIVE-session loop and the exact Shared Setup overlay focus crash.

## Acceptance truth

This hotfix and its automated tests earn zero SSJR points by themselves. SSJR-1.1 remains `0/100` until genuine two-account production evidence satisfies the fixed model and strict validator. The next evidence action after a green deployment is to resume the real two-device acceptance and prove the paired ACTIVE session advances through authoritative Shared Setup to identical `SHOWDOWN_CONFIRMED · REV 6`.

While this WEC owns an unmerged r5 release candidate, `1.9.1-r4` remains production authority and `SESSION_BOOTSTRAP.json` must not be promoted to r5 merely because current authority documents describe both the production runtime and the candidate. Promotion occurs only after exact-head publication gates, merge and deployment proof.

## Whole-shell boundary

`1.9.1-r5` is a new whole-shell identity because executable browser behavior changed. Do not certify a mixed r4/r5 shell. The r5 HTML revision, directly referenced shell assets, manifest icons, Service Worker cache identity and lazy-loaded Shared Setup/recorder assets must resolve coherently to r5. The previous coherent r4 shell remains the immediate recovery target.

## Permanent safety boundary

Firebase remains Spark and billing remains permanently forbidden. Do not enable Blaze, Cloud Billing, Cloud Run, Cloud Functions, purchased credits or any billing-required provider path. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google authentication remains popup-only browser-session persistence with no additional scopes.

Exactly two private managers remain the only remote participants. No public discovery, lobby, matchmaking, community surface, rankings or global leaderboard may be introduced. Canonical gameplay storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Shared Setup and the recorder remain non-mutating with respect to those keys. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned mutation and exact raw-snapshot rollback.
