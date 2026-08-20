# START NEXT SESSION — v1.3.0 — PR #114 SLE checkpoint

Use this file first. Do not preload full project history.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
PR #114 branch: `agent/pr114-app-check-bootstrap`
Recorded pre-SLE live main: `1ccf2d3f451ea53575698877787562e38f1d6f50`

## Live-first startup

Use the connected GitHub tool first. Fetch live `main`, PR #114 exact head/state, exact-head workflow runs, submitted reviews, inline review threads and mergeability. Never substitute the old pre-packaging green head for the final sealed head.

Initially read only:

1. `SESSION_BOOTSTRAP.json`
2. `REMOTE_JOINING_READINESS.json`
3. `WORK_ENVIRONMENT_STATUS.json`
4. `firebase.production.environment.json`
5. `00_OWNER_STANDING_MERGE_DEPLOY_AUTHORIZATION.md`

Expand to the complete SLE handoff only if current live state, security/recovery authority, CI failure or WEC continuity requires it.

## Standing merge/deploy authorization

The owner granted permanent project-wide authorization on 2026-08-20: once a PR passes every required test and current mandatory publication gate, current and future developers may merge and deploy it without asking the owner again. This remains valid through full project completion unless the owner later revokes or narrows it.

For PR #114, this supersedes the earlier draft-only/no-merge limitation. After the final immutable sealed head passes all required gates, mark ready if needed, squash-merge using expected-head protection, verify resulting live `main`, and complete applicable deployment verification without another approval prompt.

Do not weaken or skip exact-head CI, reviews/threads, mergeability, WEC, security, recovery, versioning or deployment gates.

## Current production truth

App/package: `1.4.0`
Runtime: `1.4.0-r1`
Production Firebase runtime: disconnected
Production Firestore Rules: provider-verified deployed; browser create/update/delete remains deny-all
Firebase App Check registration: provider-verified complete with reCAPTCHA Enterprise
TTL: one hour
Risk threshold: `0.5`
Enforcement: OFF
App Check client/runtime bootstrap connected: NO
Trusted runtime IAM: not activated

PR #114 adds provider evidence plus dormant `js/productionAppCheckBootstrap.js`. It remains absent from the shipped website runtime and does not justify an application/runtime version bump.

## PR #114 final gate

The engineering head `30ea11102840ad84352c3402f52af107fde1935c` previously passed all 13 normal PR workflow families, but later SLE packaging moved the branch. The only valid publication proof is the final sealed exact head.

Required final proof:

1. all 13 normal workflow families green on one unchanged final head;
2. submitted reviews clean;
3. inline review threads clean;
4. mergeability clean;
5. no later branch mutation after the final WEC seal;
6. then use standing authorization to merge/deploy without asking again.

If any workflow fails, fetch exact run jobs and the exact failed job log before changing code. Repair only the objective failure and require a new immutable exact-head proof.

## WEC and owner report

Validate inherited WEC first. Initialize the successor's own fresh environment before beginning the next substantial milestone. Never inherit the predecessor's transition decision as the successor's decision. Never fabricate hidden usage.

Every substantive owner-facing checkpoint uses exactly:

`Handoff proximity: X%`
`Remote Joining readiness: ~Y%`
`Current lane: ...`
`Concrete dependency completed: ...`
`Next unlock: ...`
`Blocker: ...`
`Sidequest check: ...`

Remote Joining readiness comes only from `REMOTE_JOINING_READINESS.json` / RJR-1. It is separate from WEC/Handoff proximity.

## Protected dependency boundary

Private Remote Joining remains the highest long-term priority, dependency-gated and stability-first. Stage 3 Registered Devices / Private Pairing remains blocked until genuine Stage 2 production/operational trust work is complete.

Do not enable App Check enforcement yet. Do not grant browser Firestore writes. Do not silently broaden IAM. Do not restore public discovery/community/matchmaking/rankings/leaderboards. Preserve canonical local storage and Candidate A/B/C recovery authority.

After PR #114 is merged and live-main is verified, the next substantive dependency is controlled production Firebase/App Check runtime-config delivery and legitimate App Check traffic proof while enforcement remains OFF. Begin that only in a fresh successor WEC after this WEC=100 checkpoint is closed.

Deep fallback handoff: `SUCCESSOR_HANDOFF_PR114_APP_CHECK_SLE_2026-08-20.md`.

This v1.3.0 starter supersedes v1.2.0 because the later owner standing merge/deploy authorization materially changes publication behavior while preserving all safety gates.
