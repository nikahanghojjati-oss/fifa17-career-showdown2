# JOB-1681 — leagueWheel.js, second-half gameplay audit

no findings

Three riskiest places checked:

1. `js/leagueWheel.js:184-214` — Confirmation saves `League Confirmed` before moving into Club Assignment, restores the previous status if saving fails, and prevents continuation after clubs are locked. No confirmed save/continuation bug from these paths.
2. `js/leagueWheel.js:216-255` — The main action distinguishes a selected league from an unselected one, defers to the locked-club check and rejects spinning while an operation is active. No demonstrated double-spin or re-selection bug.
3. `js/leagueWheel.js:265-318` — The spin locks controls, uses operation identity and showdown identity to reject stale callbacks, and rolls back the selected league and status when persistence fails. No demonstrable wrong league or stuck control in the normal supported flow; the stale-operation callback was specifically reviewed alongside `cancelLeagueWheelOperation()` (lines 104-115).

Scope: findings-only reading audit. No game file was changed.
