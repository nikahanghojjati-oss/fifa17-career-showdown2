# Audit: js/productionSharedJourneyEntry.js, first half (lines 1-143)

Job 1515 · Queue item 0098 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Findings

no findings

## Riskiest places checked (no finding)

- Lines 95-98, the reuse path in `provisionJoinerShell`: when Daniel's code is pasted again and an empty pending shell with the same season length already exists, the function returns true without the `showScreen("mainMenu",false)` call and without `normalizeCanonicalPlayers()` (lines 117 and 114, fresh path only). The screen after this path depends on the caller, which is not in this half; the second-half audit (productionSharedJourneyEntry-2.md) should confirm it lands on the same screen as the fresh path. Not confirmed as a bug here.
- Lines 110-126, the failure path: `setPending(false)` and `discardUnmarkedShell()` run only when `marked` is false, and `round.value` is always restored in `finally`, so a failed setup cannot leave the season-length field changed or a half-marked shell behind.
- Lines 37-39, `persistPendingMarker`: the in-memory marker is rolled back when either the save or the verification fails, so a failed save does not leave `setupPending` set in memory.
- Lines 133 and 139, the pair-state retry: the first `syncPair` result is retried only when it is missing or `unavailable`, and an unavailable state stops the fresh start with a message instead of starting a new Showdown.
