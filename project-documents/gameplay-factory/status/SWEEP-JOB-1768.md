# SWEEP-JOB-1768 · Shared canonical scoring audit

Compared `JOB-1768.md` against current `gameplay/bug-list-1` (r75). Gameplay findings only.

| finding | file:line then -> file:line now | verdict | evidence (quoted lines) |
| --- | --- | --- | --- |
| While the player switches Showdowns, a retained confirmed Setup from the previous rivalry could supply that old rivalry's score and season winner to the current Season Review. | `js/productionSharedCanonicalScoring.js:57-60` (old provider options) -> `js/productionSharedCanonicalScoring.js:62-65` | **FIXED** | Current line 62: `const setup=setupApi?.getState?.();if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.rivalryId||!setup.sessionId||!setup.deviceId)pcscFail("CANONICAL_SCORING_SETUP_NOT_CONFIRMED");`<br>Current line 63: `if(String(setup.rivalryId)!==request.rivalryId)pcscFail("CANONICAL_SCORING_CONTEXT_STALE");`<br>Current line 65: `return {user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,teamCount:pcscTeamCount(),cryptoImpl:root.crypto,nowEpochMs:Date.now()};` The mismatch is rejected before scoring reads the other Showdown. |

Still open: 0
