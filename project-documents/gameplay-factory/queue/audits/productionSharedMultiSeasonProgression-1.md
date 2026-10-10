# Audit: js/productionSharedMultiSeasonProgression.js, first half (lines 1-77)

Job 1519 · Queue item 0106 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Finding 1 · SURE · lines 11, 40-41 · after a page reload the season cursor resets to 1, even mid-journey

What the player sees: the player reloads the page in the middle of a multi-season Shared Journey (for example season 3 of 5, with 2 seasons accepted). The dashboard and the season screens for the current season then point at season 1, so the player may see the wrong season, or be unable to submit the season 3 result because the screens look for season 1.

Why: `exposedSeason` is module state that starts at 0. On the first call per page load, `pmspEnsureCursor` sees that `exposedRivalryId` is empty, so it sets the cursor to 1. Nothing reads the authoritative `state.activeSeason` (the protocol sets `activeSeason = acceptedSeasons + 1`, js/sharedMultiSeasonProgression.js line 44), and the only other assignment is in the continue path (line 144):
```
if(exposedRivalryId!==rivalryId){exposedRivalryId=rivalryId;exposedSeason=1;view=null;contextKey="";}
...
if(!Number.isInteger(exposedSeason)||exposedSeason<1)exposedSeason=1;
```
`pmspResolveSeason` returns `pmspEnsureCursor()` once the view is authoritative (line 48), so js/productionSharedSeasonResults.js (`pssrSeason`) and js/productionSharedSeasonCommit.js (`psscSeason`) both get season 1 after a reload.
Smallest change: when the view is authoritative for this rivalry, seed `exposedSeason` from `view.state.activeSeason` (or `acceptedSeasons + 1`) instead of 1 when the rivalry first appears in this page load, for example in `pmspEnsureCursor` or right after `view` is set in the refresh path.

## Riskiest places checked (no other finding)

- Lines 47-48, `pmspResolveSeason`: falls back to `currentRound` until the view is authoritative for this rivalry, so a request before the first read does not use an unverified season.
- Lines 57-58, setup gate: the revision 6 check and the rivalry match are the same as in the season results and commit files.
- Lines 68-71, `pmspDashboardProjection`: rejects a dashboard whose `acceptedSeasons` or `lastSeason` disagree with the state. Line 69 uses `Number(null)===0`, which would turn a null total into 0; this is a minor, unverified point and not a finding.
