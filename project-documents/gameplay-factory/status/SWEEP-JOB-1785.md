# SWEEP-JOB-1785 · Shared Journey Conflicts

Checked against `gameplay/bug-list-1` (release r75), 2026-10-13.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| A second altered replay of an accepted shared journey operation could reach the provider after the first altered replay had been rejected. | `js/sharedJourneyConflicts.js:87–94` -> `js/sharedJourneyConflicts.js:91–93` | **FIXED** | Line 91: `if(prior.classification==="REPLAY_ALTERED")jcFail("JOURNEY_CONFLICT_REPLAY_ALTERED");`<br>Line 92: `if(prior.staticHash!==attempt.staticHash){makeReceipt(attempt,{classification:"REPLAY_ALTERED",providerCode:"JOURNEY_CONFLICT_REPLAY_ALTERED",providerInvoked:false,retryCount:prior.retryCount});jcFail("JOURNEY_CONFLICT_REPLAY_ALTERED");}`<br>Line 93: `if(prior.attemptHash===attempt.attemptHash)return jcFreeze({attempt,prior,staleRetry:false});` Now the altered-replay receipt is rejected before the matching-hash reuse path. |

Still open: 0
