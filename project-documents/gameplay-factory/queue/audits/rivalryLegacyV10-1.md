# rivalryLegacyV10-1 (JOB-1567): first-half audit of js/rivalryLegacyV10.js

Result: no findings (the first candidate was checked and withdrawn).

Withdrawn candidate: js/rivalryLegacyV10.js line 39 reads `model.history.showdowns[0]` in `rivalryFrame`. The career index is append-ordered (js/persistentNikDanielPair.js lines 104-108), so index 0 is the oldest rivalry. But the Rivalry Statistics screen refreshes from `CareerModeSharedActiveShowdownAdapter.buildActiveShowdownViews` (lines 202-205), which returns `active.rivalry` without a `history` field, so the `model.history` branch is not used on that path. It runs only when a supplied model carries `history`, which was not confirmed for `rivalryStatisticsModel` in js/statistics.js line 558.

Riskiest places checked:
1. `rivalryFrame` `model.history` branch (lines 34-54): reached only with a supplied model that has `history`. If that model ever lists several Showdowns, the first one is shown. Confirm the supplied shape before changing it.
2. `historyFrame` validation (lines 19-33): any malformed completed row turns the whole history into "unavailable" rather than a partial list.
3. `draw` (lines 97-119): the TRY AGAIN retry is added only when the banner exists, and the host markup is rebuilt on each draw, so listeners and the back button are not duplicated.
