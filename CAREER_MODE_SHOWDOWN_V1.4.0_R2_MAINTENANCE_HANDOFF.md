# Career Mode Showdown v1.4.0-r2 Maintenance Handoff

Status: RELEASE CANDIDATE / PR #115 / PRODUCTION PROOF PENDING
Application version: `v1.4.0`
Runtime revision: `1.4.0-r2`
Previous known-good whole shell: `1.4.0-r1`
Starting live main: `7944b87a20cf793c659077d7518c4446f178e32c`
Branch: `agent/production-app-check-runtime`
Pull request: #115

## Purpose

This bounded maintenance candidate advances one direct prerequisite toward Private Remote Joining: production client App Check initialization and legitimate attestation traffic. It does not implement Registered Devices, pairing, Connected Rivalry, Remote Joining session UX, trusted shared mutations, or broader IAM.

## Runtime boundary

The existing Career Mode Showdown application remains local-first and starts independently of Firebase. `js/productionFirebaseRuntime.js` is appended through the existing lazy post-startup path and activates only for the exact production GitHub Pages origin and `/fifa17-career-showdown2/` path while online.

The tracked `firebase.runtime-config.json` is deliberately `configured:false` and contains no provider-issued Firebase Web API key. `scripts/render-production-firebase-public-config.mjs` is the controlled deployment renderer for the public Firebase Web API key and reCAPTCHA Enterprise site key. Provider-issued values must not be newly hard-coded into committed runtime source or printed into logs.

The production runtime loads only Firebase App core and Firebase App Check browser modules, initializes the PR #114 `ReCaptchaEnterpriseProvider` boundary with token auto-refresh, and performs an explicit App Check token request for production traffic proof. Raw App Check token contents are not placed into diagnostics. App Check enforcement remains OFF.

Every application-client Firestore create/update/delete remains deny-all. This candidate initializes no browser Firestore, Firebase Authentication, Storage, Functions, trusted mutation gateway, device/pairing authority, rivalry/session authority, gameplay authority, or Google Cloud IAM authority.

## Recovery and installed-app locks

The Installable Offline App remains protected. Runtime `1.4.0-r2` uses `1.4.0-r1` as the immediate previous known-good whole-shell recovery target. The Service Worker must never activate an incomplete r2 shell, and rollback selection must continue to verify the complete previous cache before reloading it.

Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`.

Candidate A remains a non-mutating export surface. Candidate B remains read-only analysis. Candidate C remains the sole destructive import Apply authority and keeps transaction-owned rollback, immutable confirmed intent, strict exact raw snapshot authority, stale-state guards, ownership-scoped anti-clobber behavior, and byte-for-byte recovery verification. App Check must never bypass or replace those local recovery guarantees.

## Publication gates

Do not promote `1.4.0-r2` merely because source-level tests pass. The release boundary requires:

1. one immutable final PR #115 head;
2. all 13 normal workflow families green on that exact unchanged head;
3. clean submitted reviews and clean inline review threads;
4. clean mergeability;
5. expected-head squash merge under the owner's standing merge/deploy authorization;
6. resulting live main independently verified;
7. deployed `1.4.0-r2` shell verified against source;
8. controlled production runtime configuration supplied without committing provider-issued values;
9. legitimate production App Check token traffic observed while enforcement remains OFF;
10. local/offline/recovery behavior still healthy;
11. only then may the RJR-1 ledger receive any evidence-backed capability increase.

## Failure and rollback rule

If production App Check configuration, Firebase CDN loading, bootstrap initialization, or token acquisition fails, the local Career Mode Showdown runtime remains available. Do not turn provider availability into a prerequisite for loading local saves or playing the tracker. If the r2 whole shell itself is proven defective, preserve local data and use the verified `1.4.0-r1` installed-app rollback path rather than inventing a partial mixed-version repair.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish PR #115 only. Correct objective exact-head CI failures without weakening security, recovery, performance, or versioning gates. Seal one immutable final head, verify all workflow/review/thread/mergeability gates, then expected-head squash merge and verify the deployed r2 shell. After deployment, render the controlled public Firebase/App Check configuration and prove legitimate App Check traffic with enforcement still OFF. Do not begin App Check enforcement, trusted-runtime IAM expansion, Registered Devices, pairing, Connected Rivalry, or Private Remote Joining UX inside this maintenance candidate.

Handoff proximity must continue to be reported in every substantive owner-facing project response. At Handoff proximity 100%, finish only the current safe bounded checkpoint, generate the complete successor handoff, and stop before another substantial milestone. Unknown usage must never be fabricated, and WEC remains authoritative when stricter.
