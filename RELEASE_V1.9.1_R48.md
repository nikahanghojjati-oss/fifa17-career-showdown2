# Career Mode Showdown v1.9.1 — Runtime r48

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r48`  
Previous known-good runtime: `1.9.1-r47`

## What was fixed

r48 repairs the root cause behind the missing `COMMIT SHARED SEASON` action. The r47 recovery UI exposed the cause during the physical production test on 2026-09-28: Daniel's device showed `SHARED SEASON COMMIT CHECK FAILED · SEASON_COMMIT_RESULTS_PROTOCOL_UNAVAILABLE` after both managers had published.

### Root cause

`js/sparkSharedSeasonCommit.js` captured its protocol modules when the file was evaluated, and one of them was `root.CareerModeSharedSeasonResults`.

The Shared Journey bootstrap loads that provider at page start. It did not first load `js/sharedSeasonResults.js`, which is otherwise loaded only when the Results screen opens.

After a reload, or a Continue Career straight into Results, the provider could therefore capture `undefined` and keep it for the whole page. Every Commit read then failed. r46 silently hid that failure, which was the original missing button.

Automated audits missed it because they stubbed the provider, and Node tests resolve modules with `require`.

### Fix

- The Commit provider now resolves its commit, results, setup and catalog protocols when they are used, not when the file loads.
- The bootstrap and the Commit adapter both load the Setup and Season Results protocols before the Commit provider.
- A Commit check that takes longer than 25 seconds fails visibly with `SEASON_COMMIT_CHECK_TIMEOUT` and `RETRY COMMIT CHECK`. A hung read can no longer block every later check.
  - Only the newest check, or a commit or acknowledgement after it, may update the screen, so a timed-out check that finishes late cannot overwrite a newer result.
  - The browser audit hangs a check, heals it, then releases the hung read to prove this.
- The Season Results adapter also loads the Setup protocol before its provider, closing the same latent load-order class.
- `tests/contracts/shared-season-commit-provider-contracts.cjs` evaluates the real provider in browser mode before its protocol modules exist. It then loads them into the same page global and proves that the next read and commit succeed. This check fails on r47.

## What did not change

- No Firestore Rules, provider authority, scoring formula or canonical local storage behaviour changed.
- Firebase remains Spark-only, billing remains OFF and App Check enforcement remains OFF.
- The shell and service worker advance to r48, with r47 retained for rollback.
- Private Remote Joining and the paired manager authority are unchanged.

## SSJR status

SSJR-1.1 remains frozen at `0/100`, and SSJR-2.0 remains at `0/100` until a validated two-device production run is recorded. No SSJR credit comes from this source, CI or deployment.
