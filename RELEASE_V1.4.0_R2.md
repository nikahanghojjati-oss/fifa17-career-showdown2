# Career Mode Showdown v1.4.0 Runtime Maintenance r2

Date: 2026-08-20 ET
Application version: `v1.4.0`
Runtime asset revision: `1.4.0-r2`
Previous known-good runtime: `1.4.0-r1`
Status: CANDIDATE — exact-head CI, merge, deployment and production App Check traffic proof pending
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## Release purpose

This bounded runtime maintenance release introduces the production client-side Firebase App Check integration path required for the private Remote Joining dependency chain without turning cloud availability into an application startup dependency.

The runtime remains local-first. The production Firebase runtime is loaded only after the existing Career Mode Showdown application has initialized, only on the exact production GitHub Pages origin/path, and only when controlled public runtime configuration has been rendered for deployment. Missing configuration, offline use, Firebase CDN failure, App Check bootstrap failure or token failure leaves the local application available and does not weaken storage/recovery behavior.

## Runtime behavior

- `js/productionFirebaseRuntime.js` is loaded lazily after local application startup.
- The runtime requires the exact production GitHub Pages origin and `/fifa17-career-showdown2/` path.
- A tracked `firebase.runtime-config.json` placeholder is intentionally `configured:false` and contains no provider-issued Firebase Web API key or reCAPTCHA Enterprise site key.
- `scripts/render-production-firebase-public-config.mjs` renders those two public provider values from controlled deployment environment inputs without printing them.
- The dormant PR #114 App Check bootstrap is loaded on demand only after eligible production runtime configuration is present.
- Firebase browser modules are pinned to `12.17.0`, using only Firebase App core and App Check modules.
- App Check uses `ReCaptchaEnterpriseProvider`, token auto-refresh, and an explicit `getToken()` call so legitimate production attestation traffic can be observed after controlled configuration is deployed.
- No Firestore, Authentication, Storage, Functions or trusted mutation client SDK is initialized by this runtime milestone.
- App Check enforcement remains OFF.
- Every application-client Firestore create/update/delete remains deny-all.

## Security and recovery boundaries

App Check remains application attestation only. It does not become Firebase Authentication, Career Mode Showdown authorization, `accountId`, device identity, pairing authority, rivalry/session authority, gameplay authority, shared mutation authority or Google Cloud IAM authority.

Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`. Candidate A/B/C recovery authority, offline/local operation and the previous whole-shell rollback path remain protected.

Concrete provider-issued public configuration is not newly hard-coded into committed source. Production configuration must be rendered through the controlled deployment input path. Long-lived service-account credentials, OAuth refresh tokens and Admin credentials remain prohibited.

## Whole-shell relationship

Production candidate shell: `1.4.0-r2`
Immediate previous known-good whole shell: `1.4.0-r1`

The r2 whole-shell identity is required because `index.html`, `js/app.js`, the Service Worker cache identity and runtime JavaScript change together. Publishing these bytes under `1.4.0-r1` would risk mixed installed-app state. `1.4.0-r1` therefore remains the exact rollback target until r2 is fully production-proven.

## Completion gates

This release is not production-proven merely because its source is merged. It requires one unchanged final PR head with all normal workflow families green, clean submitted reviews and inline threads, mergeability, expected-head squash merge, deployed `1.4.0-r2` verification, controlled production runtime configuration, legitimate App Check token traffic observed with enforcement still OFF, and no regression to local/offline/recovery behavior.

Remote Joining readiness must not increase merely for repository/process publication. Any RJR-1 increase requires new verified capability evidence after the production App Check traffic gate is actually proven.
