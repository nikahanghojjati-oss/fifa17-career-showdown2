# Z-001 — Physical incident baseline and source-supported boundaries

**Status:** RESEARCH-COMPLETE (source inspection / owner report only), not externally verified.  
**Research date:** 2026-10-08  
**Evidence basis:** user-provided account and three screenshots (O), repository inspection (S).  
**Code anchor:** `bc77a0b934c3d43279f27f73a72db21c2db2b4f2` (research branch base).  
**No T/P proof performed.** No production login, cross-device reproduction, file mutations outside research documents or safety bypass.

## Research question

What happened in the reported three attempts, what do the supplied screenshots actually show, and which points in the current app architecture are relevant without prematurely claiming a single root cause?

## Reconstructed incident sequence (only as granular as evidence permits)

| Run | Owner-reported action | Observed result | Evidence | Uncertainty |
|---|---|---|---|---|
| 1 | Nik and Daniel proceed to Transfer War Room on two devices; Daniel uses tablet. | Layout cards/boxes don't fit; transfer step produces signing 1 validation message; after refresh continuation is lost. | O-01 / O-02 | The exact tablet viewport, fields chosen, provider response and data recovery path are unknown. |
| 2 | New test reaches league draw and club selection, then Continue Career. | Game disconnects/restarts instead of resuming same shared play; pairing and setup repeated. | O-03 | "Restart" may be UI re-entry or actual authority state change. No state trace. |
| 3 | A further attempt to sign back in/start. | Home shows season indicator but sign-in entry is absent; sign-in overlay remains "Opening Google sign-in…"; Settings login doesn't yield game-ready manager; old Offline App panel surfaces. | O-04–O-07 | May include distinct device/browser states; sequence and causality among UI, provider, service worker and local saves are not established. |

Do **not** interpret O-05's visible Connecting overlay as proof that a popup opened or that Google accepted credentials. Do **not** interpret O-02 as proof that tablet CSS was the cause of the server validation message. Do **not** treat "Season 1/1" as evidence of a valid active connected session.

## Source-grounded architectural map

### A. Home identity may exist only after dynamic module setup

The checked-in [Home header](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/index.html#L41-L45) always includes `seasonIndicator`, but the identity element is inserted later by [`ensureOnlineIdentityBadge()`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js#L42). The app's [dynamic identity bootstrap](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/showdown.js) provides a plausible seam for this asymmetry if startup fails. This **supports an investigation path**, not a proven broken initialization.

### B. "Signing in" spans several different authorities

[`signInOnlineIdentity()`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js#L49-L50) displays "Opening Google sign-in…" before awaiting dependency setup, account sign-in and identity reinitialization. [`sparkConnectedSignIn()`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/sparkConnectedAccount.js#L154-L193) uses session-only Firebase Auth, opens a popup after initialization and returns state results which may signal popup failure, incomplete account bootstrap or account unavailability. The identity caller does not inspect the returned sign-in status at that point. Authenticated Google user, private account readiness, registered device, chosen manager and pair/session authority are separate.

### C. Settings offline content exists but is intended to be hidden

[`settings.js`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/settings.js) creates OFFLINE APP content. The current online identity module uses both [injected containment CSS](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js#L24) and [Settings hiding logic](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js#L43-L46). A visible old panel should trigger version/DOM/style/load-order study. It is not sufficient to diagnose a cache corruption.

### D. Continue Career crosses more than one state model

[`js/screens.js`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/screens.js) binds a local resume path; [`onlinePlayerIdentity.js`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/onlinePlayerIdentity.js#L53-L57) introduces connected pairing continuation; [`productionSharedJourneyEntry.js`](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/js/productionSharedJourneyEntry.js) assesses provider session and confirmed setup for shared experience entry. A reliable resume requirement must resolve the *same manager-device-rivalry-session context* and the per-device canonical-screen progress before changing navigation.

### E. Version and safety limits

The inspected [index asset revision](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/index.html#L6) and [service worker](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/service-worker.js#L1-L13) declare `1.9.1-r62` and a retained `r61`. That is a **repository fact** only; it cannot establish what Nik or Daniel's browser loaded during the playtest. Safety constraints come from [product guards](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/CURRENT_PRODUCT_GUARDS.json) and [AGENTS](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/bc77a0b934c3d43279f27f73a72db21c2db2b4f2/AGENTS.md): no zero-billing compromise, persistence policy shortcut, account mismatch bypass or destructive save overwrite.

## Five discriminating questions for later blocks

1. On affected device, was the identity badge absent from DOM, hidden by styling, or replaced by failed bootstrap? (Z-013)
2. Did the Google popup launch after initialization, and which state did Firebase Auth and the connected bootstrap return? (Z-005–Z-008)
3. Did both devices share the same deployed runtime revision and intact script/CSS controls? (Z-002, Z-026)
4. Did Continue Career restore an existing pair and exact ACTIVE session, or route into local resume/new setup? (Z-017–Z-024)
5. Did tablet orientation/viewport hide required signing values, or did provider validation fail despite visible fields? (Z-029–Z-032)

## Findings disposition

- **Observed:** Three distinct user-visible disruptions; the on-screen text as documented by O-01–O-07.
- **Source-supported:** Dynamic Home identity insertion, multi-step auth readiness, old Settings content + containment layer, separate Continue Career routes, versioned service worker.
- **Inferred, unproven:** Popup gesture failure, stale cache mismatch, identity state-machine race, resume handler race, CSS-caused validation failure.
- **Unknown:** Exact device runtime, Firebase auth outcomes, actual provider responses, saved state after each run, repeatable test, independent physical confirmation.

**Conclusion:** Problem Z must be treated as an *end-to-end account-to-shared-journey continuity investigation*, not a single missing button, styling tweak or cache-clear request. This closes the incident-baseline *research* block only; root cause, security-safe fix and production readiness remain fully open.

**Next block: Z-002 — Live revision and deployment provenance.** Identify current source vs deployment vs browser revision boundaries, record what can and cannot be proven without accessing Nik/Daniel's devices. No unapproved live diagnostic action.
