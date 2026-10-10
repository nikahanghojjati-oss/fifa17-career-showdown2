# Audit: js/productionSharedSeasonCommit.js, first half (lines 1-76)

Job 1511 · Queue item 0090 · Read on factory/gameplay-v1 @ 986c7a1e1 (the file on qa/mega-audits differs; the active gameplay line was audited).

## Findings

no findings

## Riskiest places checked (no finding)

- Line 45, `results.state?.revision===2`: correct. In js/sharedSeasonResults.js the rule is `publishedRoles.length===revision`, so RESULTS_READY (both managers published) is revision 2.
- Line 60, `setup.setup.revision!==6`: correct. The same SHOWDOWN_CONFIRMED value (revision 6) is checked in productionSharedSeasonResults.js and js/sharedSeasonResults.js line 27.
- Line 48, `psscWithTimeout`: the 25 s race wraps the status read (`psscRefreshNow` at line 113), not the commit. The read keeps running after the race rejects, so a late read could land after a newer one. This is outside the first half; the second half should check that `generation` or `readGeneration` discards late results.
- Line 9, `psscReadTimeoutMs`: a missing, non-numeric or out-of-range `CMS_COMMIT_READ_TIMEOUT_MS` falls back to 25000 ms, which is safe.
