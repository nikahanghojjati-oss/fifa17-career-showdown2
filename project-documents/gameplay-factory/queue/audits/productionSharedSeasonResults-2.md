# Audit: js/productionSharedSeasonResults.js, second half (lines 78-153)

Job 1510 · Queue item 0088 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Findings

no findings

## Riskiest places checked (no finding)

- Line 139: `if(!pssrContextMatches(request))return true;` returns success after a publish was sent when the season context changed mid-flight. The draft is dropped on the next render (line 121), and the callers (`void pssrPublish()`) ignore the return value, so the player is not misled on screen. Checked, not a bug.
- Lines 128, 132 and 148: double tap on PUBLISH. The `busy` check and `busy=true` happen synchronously before the first `await`, and the capture handler stops the event, so a second tap returns early without a second publish.
- Lines 84 and 79: the maximum points `(teamCount-1)*2*3` is correct for a double round robin (3 points for each of 2(n-1) games). The team count falls back to 20 only when `catalog[leagueId]` is missing; `sharedShowdownCatalog.js` exports `catalog`, so the normal path reads the real count.
- Line 149: the polling stop condition (RESULTS_READY with both `allResults` present) and the context reset that clears `view` and `draft` are consistent with the line 121 guard.
