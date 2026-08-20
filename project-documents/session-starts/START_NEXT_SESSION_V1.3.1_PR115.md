# START NEXT SESSION — v1.3.1 — PR #115 SLE checkpoint

Use this file first. Do not preload full project history.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
PR #115: `Connect production App Check runtime safely`
Branch: `agent/production-app-check-runtime`
Recorded base/live main before PR #115 publication: `7944b87a20cf793c659077d7518c4446f178e32c`
Recorded pre-packaging validated head: `36debe7511bd4001a17be03b5e3d787559fd032a`

## Live-first startup

Use the connected GitHub tool first. Fetch live `main`, PR #115 exact head/state, exact-head workflow runs, submitted reviews, inline review threads and mergeability. Never substitute the pre-packaging green head for the final transition-prepared sealed head.

Initially read only:

1. `SESSION_BOOTSTRAP.json`
2. `REMOTE_JOINING_READINESS.json`
3. `WORK_ENVIRONMENT_STATUS.json`
4. `firebase.production.environment.json`
5. `00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md`

Expand to `SUCCESSOR_HANDOFF_PR115_APP_CHECK_RUNTIME_SLE_2026-08-20.md`, `NEXT_TASK.md`, runtime source or exact failed-job logs only if live state or a gate requires it.

## Current candidate truth

Application/package: `1.4.0`
Production runtime at handoff: `1.4.0-r1`
PR #115 candidate runtime: `1.4.0-r2`
RJR-1 readiness at handoff: `59/100`
App Check provider registration: verified reCAPTCHA Enterprise
Token TTL: one hour
Risk threshold: `0.5`
App Check enforcement: OFF
Application-client Firestore create/update/delete: deny-all
Trusted runtime IAM activation: not part of PR #115
Stage 3 Registered Devices / Private Pairing: still blocked

PR #115 adds a local-first production Firebase App + App Check runtime path only. It does not initialize Firestore, Firebase Authentication, Storage, Functions or a trusted mutation client service. It adds no IAM permission, no browser write authority and no Remote Joining UX.

Tracked `firebase.runtime-config.json` remains fail-closed and contains no concrete provider-issued values. Controlled public runtime configuration uses `CMS_FIREBASE_WEB_API_KEY` and `CMS_RECAPTCHA_ENTERPRISE_SITE_KEY` through `scripts/render-production-firebase-public-config.mjs`. Do not hard-code, log or invent either provider value. If a deployment value is missing, have the owner enter it directly into the controlled GitHub deployment configuration rather than pasting it into chat.

## Pre-packaging proof

On exact head `36debe7511bd4001a17be03b5e3d787559fd032a` all 13 normal workflow families completed successfully, including Chromium Stability and Candidate C browser recovery. Submitted reviews were empty, inline review threads were empty and PR #115 was mergeable.

Packaging and the final WEC seal move the branch after that head. Publication authority is only the final sealed exact head.

## Immediate task — finish PR #115 publication only

First initialize a fresh successor WEC. The predecessor transition decision is historical and must not become the successor's decision.

Then:

1. fetch PR #115 and identify the final transition-prepared sealed exact head;
2. verify the WEC seal is the last branch mutation;
3. require all 13 normal workflow families green on that unchanged sealed head;
4. re-check submitted reviews, inline review threads and mergeability;
5. use the standing owner authorization to mark ready if required and expected-head squash-merge without asking again;
6. independently verify resulting live `main`;
7. verify deployed `1.4.0-r2` with `1.4.0-r1` retained as rollback authority;
8. deliver controlled browser-public Firebase/App Check runtime configuration without committing provider values;
9. prove legitimate production App Check token traffic while enforcement remains OFF;
10. verify local/offline operation and deny-all application-client Firestore writes remain healthy;
11. update production evidence and RJR-1 only if new capability evidence actually satisfies its ledger criteria.

Do not enable App Check enforcement yet. Do not broaden IAM. Do not grant browser Firestore writes. Do not begin Stage 3 until remaining genuine Stage 2 production/account/operational trust and IAM hardening prerequisites are DONE / MERGED / PROVEN.

## Standing merge/deploy authorization

The owner granted project-wide standing authorization on 2026-08-20 through full project completion: after every required test and mandatory publication gate passes, current/future developers may merge and deploy without requesting another owner confirmation. Later explicit owner instructions may revoke or narrow it.

Authority:

`00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md`
`authority-history/OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION_2026-08-20.md`

## Permanent locks

Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns` and `careerModeShowdown.preferences`; `activeShowdown` is not canonical.

Candidate A remains non-mutating export. Candidate B remains read-only import analysis. Candidate C remains the sole destructive Apply authority.

Public discovery, profiles, matchmaking, invitation directories, lobbies, community, rankings and global leaderboards remain prohibited/eliminated.

Private Remote Joining remains the highest long-term priority, dependency-gated and stability-first.

## WEC and owner reporting

Every substantive owner-facing development checkpoint uses exactly:

`Handoff proximity: X%`
`Remote Joining readiness: ~Y%`
`Current lane: ...`
`Concrete dependency completed: ...`
`Next unlock: ...`
`Blocker: ...`
`Sidequest check: ...`

Handoff proximity is WEC transition proximity, not task completion. Remote Joining readiness comes only from `REMOTE_JOINING_READINESS.json` / RJR-1. Never fabricate hidden usage.

Deep fallback handoff: `SUCCESSOR_HANDOFF_PR115_APP_CHECK_RUNTIME_SLE_2026-08-20.md`.

This v1.3.1 starter is a PATCH successor-bootstrap checkpoint over v1.3.0: it preserves the same startup protocol and standing authorization model while advancing live authority from merged PR #114 to the PR #115 production App Check runtime publication boundary.
