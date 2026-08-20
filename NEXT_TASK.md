# NEXT TASK — Career Mode Showdown

## CURRENT IMPLEMENTATION AUTHORITY — PR #115 PRODUCTION APP CHECK DEPLOYMENT PROOF VIA PR #116 — 2026-08-20 ET

Current verified source, live GitHub, the owner's Remote Joining priority / anti-sidequest direction, and later owner instructions override historical provenance below.

Status: CURRENT RJR PREREQUISITE / PR #115 MERGED / PR #116 DEPLOYMENT-PROOF CANDIDATE / PRODUCTION APP CHECK CLIENT INTEGRATION / ENFORCEMENT OFF / BROWSER FIRESTORE WRITES DENY-ALL.

Current branch: `agent/pr115-production-deployment-proof`.
Current pull request: #116 `Add controlled GitHub Pages App Check deployment`.
Current environment: `we-2026-08-20-pr115-production-deployment-proof`.
Starting independently verified live main: `1c4758c8dcfb4cc6b652bb5aafc73ebe532be0cd`.
Fresh WEC decision: `PREPARE_HANDOFF`.
Usage: unavailable and not estimated.
Authorized product candidate: none.

Work Environment Continuity remains mandatory. This environment may finish only the current PR #115 / PR #116 production App Check deployment-proof boundary, must keep `WORK_ENVIRONMENT_STATUS.json` current at meaningful checkpoints, and must obey the fresh WEC assessment before any separate next milestone. The predecessor `HANDOFF_NOW` decision belongs only to `we-2026-08-20-production-app-check-runtime` and does not become successor implementation authority.

Application version: `v1.4.0`.
Current production Installable Offline App runtime: `1.4.0-r1`.
Current candidate runtime revision: `1.4.0-r2`.
Immediate previous known-good whole shell for this candidate: `1.4.0-r1`.
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening.

PR #114 is DONE / MERGED / PROVEN through live main `7944b87a20cf793c659077d7518c4446f178e32c`. Production Firebase App Check is provider-registered for the real Web App with reCAPTCHA Enterprise, one-hour TTL, 0.5 risk threshold and enforcement OFF.

PR #115 `Connect production App Check runtime safely` is DONE / MERGED AS SOURCE at live main `1c4758c8dcfb4cc6b652bb5aafc73ebe532be0cd`. Its final sealed head `0ce83bc1b58cb40cf5b766dd76addfd4d00eecb2` passed all 13 normal workflow families with clean reviews, threads and mergeability before expected-head squash merge. PR #115 alone did not make `1.4.0-r2` production-proven because tracked `firebase.runtime-config.json` correctly remains fail-closed and legitimate production App Check traffic has not yet been observed.

PR #116 is the direct bounded continuation required to finish that same production proof. It adds the controlled GitHub Pages deployment-artifact path that renders the two browser-public provider values only inside the deployment artifact and leaves committed source fail-closed.

Private Account / Authentication / Authorization Stages 2A through 2I are DONE / MERGED / PROVEN at their protected prerequisite boundaries. The later trusted shared mutation gateway, trusted account deletion execution and trusted connected-data export prerequisites are also completed. Stage 2 as a whole remains incomplete only because real production operational activation, trusted runtime/IAM proof and launch hardening remain unfinished.

## Current bounded engineering task

Finish PR #116 only as the publication/deployment continuation of PR #115. Preserve the already-proven `1.4.0-r2` App Check runtime while establishing controlled GitHub Pages deployment-time configuration, then hand off at the clean provider-configuration boundary. Do not begin another Stage 2 milestone in this environment.

Required behavior:

1. Local Career Mode Showdown startup, canonical browser storage and recovery must not depend on Firebase/App Check availability.
2. Production Firebase/App Check initialization runs only for `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/` and only while online.
3. Tracked `firebase.runtime-config.json` remains fail-closed when unconfigured or invalid.
4. Firebase App Check initializes before any future Firebase service access.
5. Use the provider-registered reCAPTCHA Enterprise boundary with token auto-refresh enabled.
6. Obtain one App Check token in the eligible production runtime so legitimate attestation traffic can be observed before enforcement.
7. Do not initialize Firestore, Firebase Authentication, Storage, Functions or any trusted mutation client service in this milestone.
8. App Check enforcement remains OFF.
9. Every application-client Firestore create/update/delete remains deny-all.
10. App Check remains application attestation only and grants no account identity, application authorization, device identity, pairing authority, rivalry/session authority, gameplay authority, shared mutation authority or IAM authority.
11. Production debug App Check remains forbidden.
12. `1.4.0-r1` remains the exact rollback shell until r2 is fully production-proven.

## Controlled public runtime configuration

Tracked `firebase.runtime-config.json` remains `configured:false` and contains no concrete provider-issued Firebase Web API key or reCAPTCHA Enterprise site key.

`scripts/render-production-firebase-public-config.mjs` is the controlled renderer for the two browser-public provider values:

`CMS_FIREBASE_WEB_API_KEY`
`CMS_RECAPTCHA_ENTERPRISE_SITE_KEY`

These values are public browser configuration, not authorization secrets, but they must be delivered through the controlled deployment path rather than newly hard-coded into committed runtime source or printed into logs.

PR #116 adds `.github/workflows/deploy-github-pages.yml`. It stages only the static runtime surface, requires the two GitHub Actions repository variables without printing their values, runs the renderer only inside the ephemeral Pages artifact, verifies the configured output shape without logging the values, removes the copied renderer before artifact upload, and deploys through GitHub Pages with `pages: write` plus `id-token: write`. It does not use Firebase Hosting and does not write generated provider configuration back to repository history.

The protected validation topology remains 14 permanent workflow families: 13 normal PR validation workflows plus the separately-owned Stability Lane. Those validation families retain exactly 27 protected literal executable blocks. The production Pages deployment workflow is separate operational deployment infrastructure and is excluded from the validation-family and 27-block counts.

## Security, recovery and product locks

Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`.

Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive import Apply authority with strict exact raw snapshot authority, transaction-owned mutation, immutable confirmed intent, stale-state guards, ownership-scoped reverse rollback, anti-clobber behavior and exact recovery verification.

The Local Profiles and Save Library production dependency remains complete. formatVersion 2 full multi-Save backup/import portability remains production-proven. The explicit cross-Save/historical manager identity foundation and Identity-Safe Career Analytics remain protected.

Stage 2H's account-bootstrap runtime custom-role permissions remain exactly:

`firebaseauth.users.get`
`datastore.databases.get`
`datastore.entities.get`
`datastore.entities.create`

PR #115 and PR #116 add no IAM permission and no trusted mutation authority.
Historical PR #115 lock: PR #115 adds no IAM permission and no trusted mutation authority.

Cloud / synchronization readiness
→ private account / authentication / authorization
→ paired-device / private-session capability
→ Connected Rivalry
→ Private Remote Joining
→ end-to-end hardening / stable release.

Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Stage 3 Registered Devices / Private Pairing remains blocked until the genuine Stage 2 production/account/operational lane is DONE / MERGED / PROVEN. Connected Rivalry and actual Private Remote Joining remain downstream.

Public community features and global leaderboard/rankings are **ELIMINATED**. Public discovery, public profiles, public matchmaking, public invitation directories and public lobbies remain prohibited.

## PR #115 / PR #116 production-proof completion gate

The `1.4.0-r2` App Check runtime milestone may be classified DONE / MERGED / PROVEN only when:

1. `1.4.0-r2` runtime identity is coherent across index, app runtime, manifest, Home shared assets and Service Worker;
2. production App Check runtime contracts pass;
3. the controlled Pages deployment-artifact contract passes and committed `firebase.runtime-config.json` remains fail-closed;
4. the existing startup performance ceilings remain unchanged and pass;
5. the complete repository contract and Firebase emulator suites pass;
6. all 13 normal PR workflow families pass on one exact unchanged final PR #116 head;
7. submitted reviews and inline review threads are clean;
8. mergeability is clean;
9. GitHub Pages is configured to use GitHub Actions and repository Actions variables `CMS_FIREBASE_WEB_API_KEY` plus `CMS_RECAPTCHA_ENTERPRISE_SITE_KEY` are entered directly in the controlled GitHub UI rather than chat/source;
10. the final transition-prepared WEC seal is the last PR-branch mutation;
11. squash merge uses expected-head protection;
12. resulting live main and deployed `1.4.0-r2` are independently verified;
13. legitimate production App Check token traffic is observed while enforcement remains OFF;
14. local/offline operation and the `1.4.0-r1` rollback boundary remain healthy;
15. every application-client Firestore create/update/delete remains deny-all and no Firestore/Auth/Storage/Functions client service or trusted IAM authority is introduced.

Remote Joining readiness must not increase merely because PR #115 merged, PR #116 exists, CI is green, or process/authority files are updated. RJR-1 increases only when new capability evidence is actually proven at the required production boundary.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish only PR #116 on `agent/pr115-production-deployment-proof`. The engineering candidate `c9a6338f8c4e8f3efc363e7faec207f4db71f7a9` achieved all 13 workflow families green before authority synchronization. Synchronize current authority, rerun all exact-head gates, and prepare the final transition seal. Do not merge before the owner has configured GitHub Pages to use GitHub Actions and entered `CMS_FIREBASE_WEB_API_KEY` plus `CMS_RECAPTCHA_ENTERPRISE_SITE_KEY` directly in repository Actions variables. Never request those provider values in chat and never invent the reCAPTCHA site key. After those controlled settings exist, a fresh successor may verify the final sealed head, reviews, threads and mergeability, use standing owner authorization for expected-head squash merge, verify deployment and legitimate App Check traffic with enforcement still OFF, and preserve `1.4.0-r1` as rollback authority until the complete production proof passes. The current fresh WEC is `PREPARE_HANDOFF`; do not begin a separate next Stage 2 milestone here.

## Historical production and contract provenance

The following statements are retained only so permanent executable contracts can prove prior product/recovery milestones were not erased. They do not override the current PR #116 authority above.

Historical PR #115 successor authority snapshot:
Historical heading: CURRENT IMPLEMENTATION AUTHORITY — PRODUCTION APP CHECK RUNTIME INTEGRATION.
Current branch: `agent/production-app-check-runtime`.
Current pull request: #115 `Connect production App Check runtime safely`.
Current environment: `we-2026-08-20-production-app-check-runtime`.
Starting independently verified live main: `7944b87a20cf793c659077d7518c4446f178e32c`.
Fresh WEC decision: `PREPARE_HANDOFF`.
That predecessor later reached `HANDOFF_NOW`; the successor independently verified its final sealed head and merged it before correcting the required fresh-WEC sequencing order. This historical snapshot is provenance only.

Former clean-stop wording required the project to hold clean stop until a later explicit owner instruction. That later owner instruction was satisfied by the owner's Remote Joining priority and subsequent prerequisite authorizations. Do not revive the former clean stop as current authority.

Historical production identity before later runtime maintenance candidates:
Current production Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`

Historical completed product chain:
Local Profile display-label editing → Identity-Safe Career Analytics → formatVersion 2 full multi-Save backup/import portability (PR #67).
PR #67 production merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27`.
Phase B first slice — Save Library / Local Profile Experience 2.0 (PR #70) — CLOSED / PRODUCTION-PROVEN at `65b6c9db0a070b6e5e992a39dffeee23df0c6f08`.
Phase C first slice — Showdown Home & Season Experience (PR #73) — CLOSED / PRODUCTION-PROVEN at `dec1d3ba8182c3f62019974dd1704c7c9124def6`.

Historical Stage 1 wording retained for contract provenance:
Stage 1 Cloud / Sync Readiness Phase 1A through 1F remains DONE / MERGED / PROTECTED in current source.
At the earlier Phase 1D closeout, the Current authorized prerequisite candidate was Cloud/Sync Readiness Phase 1E.
The Next prerequisite after Phase 1E merges was Cloud/Sync Readiness Phase 1F.
At that historical boundary the Cloud/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED wording prevented premature provider connection. Current source has since advanced through those prerequisite boundaries.

Historical gateway heading retained only as provenance: CURRENT IMPLEMENTATION AUTHORITY — TRUSTED SHARED MUTATION GATEWAY. That gateway is completed and is not the current task.

No historical wording authorizes a new product feature, Stage 3, Connected Rivalry or Remote Joining UX inside PR #116.