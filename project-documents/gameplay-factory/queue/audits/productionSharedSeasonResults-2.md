# Audit: js/productionSharedSeasonResults.js, second half (lines 78-153)

Job 1510 · Queue item 0088 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Findings

### Finding 1 · PROBABLE · line 140 · a failed read after a successful publish shows a publish error

What the player sees: the Season Result was published, but if the refresh that follows (a brief network drop is enough) fails, the catch block at line 142 shows an error on the review panel and the entry form comes back. The rival and the player's own result are both already saved. Tapping Review again works, because the publish path then reads `ownResult` and shows the waiting state, but the first screen after the failure is wrong.

Why: the follow-up refresh is awaited inside the same try block as the write, and `draft` is already cleared, so the render after the error falls back to entry mode:
```
view={...result,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;await pssrRefreshNow(request);return true;
...
}catch(error){if(pssrContextMatches(request)){pssrSetError(error.message||error.code||"Shared Season Result publication failed.");
```
Smallest change: wrap the line 140 refresh so a failure does not reach the catch, for example `try{await pssrRefreshNow(request);}catch(_error){pssrRefresh().catch(()=>{});}return true;`. The `view` set on the line above already shows the waiting state, so the read error can surface through the refresh path (line 74) instead.

## Riskiest places checked (no other finding)

- Line 139, `if(!pssrContextMatches(request))return true;`: returns success after a publish when the season context changed mid-flight. The draft is dropped on the next render (line 121), and the callers (`void pssrPublish()`) ignore the return value, so the player is not misled on screen.
- Lines 128, 132 and 148: double tap on PUBLISH. The `busy` check and `busy=true` happen synchronously before the first `await`, and the capture handler stops the event, so a second tap returns early without a second publish.
- Lines 84 and 79: the maximum points `(teamCount-1)*2*3` is correct for a double round robin. The team count falls back to 20 only when `catalog[leagueId]` is missing; `sharedShowdownCatalog.js` exports `catalog`, so the normal path reads the real count.
- Line 149: the polling stop condition and the context reset are consistent with the line 121 guard.
