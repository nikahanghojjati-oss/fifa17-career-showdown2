# rivalryLegacyV10-1 (JOB-1567): first-half audit of js/rivalryLegacyV10.js

## Finding 1 (PROBABLE): Rivalry Statistics always reads the first Showdown in the history list, which is the oldest one
- File and line: js/rivalryLegacyV10.js line 39, `rivalryFrame`.
- What the player sees: after several Showdowns in one rivalry, the "CURRENT RIVALRY STATISTICS" screen shows the first Showdown ever played (its clubs, score, seasons and manager records), not the latest one.
- Why: `const row=model.history.showdowns[0];`
  The career index is appended in order, so the oldest rivalry comes first: `ordered.push(...parsed.rivalryIds)` and `pairPlanCareerIndexAppend` adds each new id at the end (js/persistentNikDanielPair.js lines 104-108). The closed-career adapter keeps that order (js/sharedClosedShowdownAdapter.js line 94), and no sort was found in the upstream history modules that were checked.
- Smallest change: choose the row by intent rather than by position, for example the last row of the list, or the row whose `rivalryId` matches the current rivalry. Confirm which Showdown the design means by "current" before changing it.
- Note: this is PROBABLE because the history model was not read end to end, so an upstream sort could exist outside the files checked.

Riskiest places also checked (no finding): the history validation (lines 19-20, 27) that rejects any malformed completed row and returns "unavailable" rather than a partial list, the `context()` key that stops a stale model from being drawn after a sign-in change (lines 70, 91), and the TRY AGAIN retry guard (lines 109-111).
