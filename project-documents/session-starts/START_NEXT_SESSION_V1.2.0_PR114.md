# START NEXT SESSION — v1.2.0 — PR #114 SLE checkpoint

Use this file first. Do not preload the complete project history.

You are continuing the FIFA 17 Career Mode Showdown project for owner Hawk / nikahanghojjati-oss.

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

## 1. Live-first startup

Use the connected GitHub tool first.

Fetch live `main`, draft PR #114, its exact current head, current workflow runs, submitted reviews, inline review threads and mergeability.

Recorded pre-SLE main boundary: `1ccf2d3f451ea53575698877787562e38f1d6f50` from merged PR #113.

Draft PR #114 branch: `agent/pr114-app-check-bootstrap`.

PR #114 merge is NOT authorized by the predecessor owner instruction. Do not merge unless the owner later explicitly authorizes merge.

The pre-SLE-packaging engineering head `30ea11102840ad84352c3402f52af107fde1935c` passed all 13 normal PR workflow families, but SLE/WEC packaging intentionally moved the branch afterward. Never substitute that old head for the final sealed live PR head.

## 2. Minimal reads only

After live verification, initially read only:

1. `SESSION_BOOTSTRAP.json`
2. `REMOTE_JOINING_READINESS.json`
3. `WORK_ENVIRONMENT_STATUS.json`
4. `firebase.production.environment.json`

Do not read the full handoff/history unless a real discrepancy or security/recovery/publication question requires it.

If PR #114 or live main changed, inspect only the delta first.

## 3. Fresh WEC ownership

Validate the inherited WEC record first.

Then archive predecessor facts if required, create a new unique environment ID, reset successor-owned WEC counters/signals, record the independently verified starting live-main SHA and current task, and only then run the successor's own WEC assessment.

Never inherit the predecessor's `HANDOFF_AT_CHECKPOINT` decision as your own starting decision.

Usage is unavailable unless objectively supplied. Never fabricate hidden context/account/model usage.

## 4. Permanent owner report

Every substantive owner-facing development checkpoint must use exactly this order:

`Handoff proximity: X%`

`Remote Joining readiness: ~Y%`

`Current lane: ...`

`Concrete dependency completed: ...`

`Next unlock: ...`

`Blocker: ...`

`Sidequest check: ...`

`Remote Joining readiness` comes from `REMOTE_JOINING_READINESS.json` / RJR-1. Never calculate it from PR count, stage count, WEC or number of visible actions.

Handoff proximity/WEC is a separate continuity metric. At 100%, finish only the safe bounded checkpoint, generate the successor package and stop before another substantial milestone.

## 5. Current production truth

App/package: `1.4.0`.

Runtime: `1.4.0-r1`.

Production Firebase runtime: disconnected.

Production Firestore Security Rules: provider-verified deployed from canonical `firestore.rules`; browser create/update/delete remains deny-all.

Production Firebase App Check provider registration: VERIFIED COMPLETE.

Provider: reCAPTCHA Enterprise.

Production host: `nikahanghojjati-oss.github.io`.

TTL: one hour.

Risk threshold: `0.5`.

Enforcement: OFF.

App Check client/runtime bootstrap connected: NO.

Trusted runtime IAM: not activated yet.

The PR #114 dormant module `js/productionAppCheckBootstrap.js` requires controlled public-config injection, exact production identity, `ReCaptchaEnterpriseProvider`, App Check token auto-refresh, no production debug path, no premature enforcement and no Firestore initialization.

## 6. Exact-head CI repair rule

If any PR #114 workflow fails:

1. fetch the exact workflow run;
2. fetch its jobs;
3. fetch the exact failed job log;
4. repair only the objective failure;
5. do not weaken security/recovery tests;
6. require a new exact unchanged head to pass all 13 normal workflow families.

Do not guess failure cause from workflow name.

Known predecessor repair: globally duplicated JS helper names in the App Check module were renamed after exact Stability logs identified the collision.

Do not retry the predecessor's rejected non-fast-forward `update_ref` route; use normal supported GitHub operations.

## 7. Current dependency boundary

Private Remote Joining remains the highest long-term product priority, but dependency order and stability remain mandatory.

Stage 3 Registered Devices / Private Pairing is still BLOCKED.

Do not enable App Check enforcement yet.

Do not grant browser Firestore writes.

Do not broaden IAM silently.

Do not restore public discovery/community/matchmaking/rankings/leaderboards.

Do not change canonical local storage or Candidate A/B/C recovery authority.

## 8. Immediate next action

First prove the final sealed PR #114 head: all 13 normal workflow families green, reviews clean, threads clean, mergeable clean.

Then report the checkpoint and wait for explicit owner merge authorization if merge is still not authorized.

After an eventual authorized merge and independent live-main verification, the next substantive Remote Joining prerequisite is controlled production Firebase/App Check runtime-config delivery and legitimate client App Check traffic proof with enforcement still OFF. Only after healthy metrics should enforcement be evaluated service by service.

Do not begin that next substantial milestone inside the inherited WEC=100 checkpoint before fresh successor WEC initialization.

## 9. Deep fallback

Only if needed, read:

`SUCCESSOR_HANDOFF_PR114_APP_CHECK_SLE_2026-08-20.md`

Then expand through `SESSION_CONTEXT_GRAPH.json`, `SESSION_CONTEXT_MODEL.json`, `SESSION_CONTEXT_LEARNING.json`, Stage 2I, `firestore.rules` or older history only as the evidence demands.

`NEXT_TASK.md` still contains an older PR #108 connected-export CURRENT heading. It is stale relative to later owner-authorized PR #109–#114 provider activation work. Do not regress to PR #108 merely because of that historical heading; reconcile it naturally in substantive authorized work rather than creating a documentation-only PR.

This starter is a backward-compatible MINOR startup-protocol improvement: SLE adds fixed RJR ledger authority, exact job-log-first CI triage and an explicit draft/no-merge boundary while preserving all security/WEC/recovery locks.
