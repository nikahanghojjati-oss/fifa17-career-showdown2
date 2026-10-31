# SWEEP-JOB-1780 · Shared Season Results

Checked against `gameplay/bug-list-1` (release r75), 2026-10-13.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| Expired private session is still accepted as active by the Season Results provider; players may read/publish shared Season Results after expiry. | `js/sparkSharedSeasonResults.js:60-64` -> `js/sparkSharedSeasonResults.js:60-63` | **STILL OPEN** | Line 62: `const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=ssrpTimestampMillis(value.data.expiresAt);` Line 63 still ends session validation with `||!Number.isFinite(expires))ssrpFail("SEASON_RESULTS_ACTIVE_SESSION_REQUIRED");` without `now>=expires`. The function receives `now` at line 60 and is called with it at line 135, but never checks expiry against it. |

Still open: 1
